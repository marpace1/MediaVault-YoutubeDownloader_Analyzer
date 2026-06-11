/**
 * DownloadManager — the heart of MediaVault's backend.
 *
 * Responsibilities:
 *   • Maintain an in-memory queue of DownloadItems.
 *   • Honour a configurable concurrency limit.
 *   • Spawn yt-dlp (and rely on its bundled-ffmpeg muxing) per job.
 *   • Parse yt-dlp progress output into structured DownloadProgress.
 *   • Support pause / resume / cancel / retry.
 *   • Persist every state change to SQLite and emit live updates to the UI.
 *
 * It extends EventEmitter; the main process subscribes to `progress` and
 * forwards each update to the renderer over IPC.
 */
import { EventEmitter } from 'node:events';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { mkdirSync, existsSync, statSync } from 'node:fs';
import type {
  DownloadItem,
  DownloadRequest,
  DownloadOptions,
  DownloadProgress,
} from '../../shared/types';
import { resolveBinary, resolveBinaryPathOrNull } from '../utils/binaries';
import { sanitizeFilename } from '../utils/validation';
import { readSettings } from './settings';
import { upsertDownload, removeDownload, findDuplicate } from '../db/database';
import { createLogger } from '../utils/logger';
import { humanizeError } from '../utils/errors';

const log = createLogger('downloads');

interface ActiveJob {
  item: DownloadItem;
  proc: ChildProcessWithoutNullStreams | null;
  /** the resolved output file path yt-dlp reports */
  resolvedPath: string | null;
  /** user-supplied rename (without extension), if any */
  customName: string | null;
  /** per-job output directory override, if any */
  outputDir: string | null;
  /** last time a high-frequency progress update was pushed to the UI */
  lastEmit: number;
}

export class DownloadManager extends EventEmitter {
  private jobs = new Map<string, ActiveJob>();
  private queue: string[] = []; // ids waiting to start

  /** Build a human-readable label used in the UI + duplicate detection. */
  private formatLabel(opts: DownloadOptions): string {
    switch (opts.kind) {
      case 'video':
        return `${opts.quality === 'best' ? 'Best' : opts.quality + 'p'} ${opts.container.toUpperCase()}`;
      case 'audio':
        return `${opts.format.toUpperCase()} ${opts.bitrate === 'best' ? 'Best' : opts.bitrate + 'kbps'}`;
      case 'thumbnail':
        return `Thumbnail (${opts.thumbnailLabel})`;
      case 'subtitle':
        return `Subtitle ${opts.lang.toUpperCase()} ${opts.format.toUpperCase()}`;
    }
  }

  /** Translate quality + container into a yt-dlp -f format selector. */
  private videoFormatSelector(quality: string, container: string): string[] {
    const h = quality === 'best' ? null : Number(quality);
    // Prefer specific height, fall back gracefully; merge bestaudio.
    const vsel = h
      ? `bestvideo[height<=${h}]+bestaudio/best[height<=${h}]`
      : 'bestvideo+bestaudio/best';
    return ['-f', vsel, '--merge-output-format', container];
  }

  private buildArgs(job: ActiveJob, opts: DownloadOptions, outDir: string): string[] {
    const { item } = job;
    const s = readSettings();
    // Resolve ffmpeg to a CONCRETE path. If we only have a bare PATH name we
    // must NOT pass --ffmpeg-location (it's a literal path, not a PATH lookup);
    // omitting it lets yt-dlp discover ffmpeg itself, which fixes merges (MKV)
    // and conversions (FLAC/WAV/etc.) that previously failed.
    const ffmpegPath = resolveBinaryPathOrNull('ffmpeg', s.ffmpegPath);
    // ffprobe is REQUIRED for post-processing (embed thumbnail/metadata). If it
    // isn't resolvable we must NOT request embedding, otherwise yt-dlp aborts
    // the whole job with "ffprobe not found" even though the media downloaded.
    const ffprobePath = resolveBinaryPathOrNull('ffprobe', s.ffmpegPath);
    const canPostProcess = ffprobePath !== null || ffmpegPath === null; // PATH mode: trust yt-dlp
    // Honour a user rename when provided, otherwise fall back to the title.
    const baseName = sanitizeFilename(job.customName?.trim() || item.title);
    const outTmpl = join(outDir, `${baseName}.%(ext)s`);

    const args: string[] = [
      '--no-warnings',
      '--no-playlist',
      '--newline', // one progress line per write -> easy to parse
      '--progress',
      '-o',
      outTmpl,
    ];
    if (ffmpegPath) args.push('--ffmpeg-location', ffmpegPath);

    switch (opts.kind) {
      case 'video': {
        args.push(...this.videoFormatSelector(opts.quality, opts.container));
        // Embedding needs ffprobe; skip it when ffprobe isn't available so the
        // download still succeeds (instead of aborting with "ffprobe not found").
        if (s.embedThumbnail && canPostProcess) args.push('--embed-thumbnail');
        if (s.embedMetadata && canPostProcess) args.push('--embed-metadata');
        args.push(item.url);
        break;
      }
      case 'audio': {
        // yt-dlp's codec token for the OGG container is "vorbis", not "ogg".
        // Passing "ogg" raises: "invalid audio format ogg given".
        const ytAudioFormat = opts.format === 'ogg' ? 'vorbis' : opts.format;
        args.push('-x', '--audio-format', ytAudioFormat);
        if (opts.bitrate !== 'best') args.push('--audio-quality', `${opts.bitrate}K`);
        // Thumbnail embedding is only enabled for formats FFmpeg can handle on
        // its own. mp3 + m4a/mp4 embed via FFmpeg with no extra deps. FLAC/OGG
        // require the optional `mutagen`/AtomicParsley tools and will HARD-FAIL
        // the whole job when those are absent, while WAV/AAC have no cover frame
        // at all. So we restrict embedding to the always-safe set, AND require
        // ffprobe (post-processing dependency).
        const THUMB_OK = new Set(['mp3', 'm4a']);
        if (s.embedThumbnail && canPostProcess && THUMB_OK.has(opts.format)) {
          args.push('--embed-thumbnail');
        }
        if (s.embedMetadata && canPostProcess) args.push('--embed-metadata');
        args.push(item.url);
        break;
      }
      case 'thumbnail': {
        // Download the chosen thumbnail URL directly (it's a plain image).
        args.length = 0; // override; thumbnails don't need yt-dlp progress flags
        args.push('--no-warnings', '-o', join(outDir, `${baseName}_thumb.%(ext)s`));
        args.push(opts.thumbnailUrl);
        break;
      }
      case 'subtitle': {
        args.push(
          '--skip-download',
          opts.auto ? '--write-auto-subs' : '--write-subs',
          '--sub-langs',
          opts.lang,
          '--convert-subs',
          opts.format === 'txt' ? 'srt' : opts.format,
          item.url,
        );
        break;
      }
    }
    return args;
  }

  /** Enqueue a new download and try to start it immediately. */
  enqueue(req: DownloadRequest): DownloadItem {
    const formatLabel = this.formatLabel(req.options);

    const item: DownloadItem = {
      id: randomUUID(),
      url: req.url,
      title: req.title,
      thumbnail: req.thumbnail,
      channel: req.channel,
      kind: req.options.kind,
      formatLabel,
      status: 'queued',
      progress: { percent: 0, speed: null, eta: null, downloadedBytes: null, totalBytes: null },
      filePath: null,
      fileSize: null,
      error: null,
      createdAt: Date.now(),
      completedAt: null,
    };

    this.jobs.set(item.id, {
      item,
      proc: null,
      resolvedPath: null,
      customName: req.customName ?? null,
      outputDir: req.outputDir ?? null,
      lastEmit: 0,
    });
    // Store the exact options BEFORE pump() so an immediately-started job (and
    // any future retry) rebuilds the correct yt-dlp args — never the fallback.
    this.optionsByItem.set(item.id, req.options);
    upsertDownload(item);
    this.queue.push(item.id);
    this.emitUpdate(item);
    this.pump();
    return item;
  }

  /** Check for an already-completed identical download. */
  checkDuplicate(req: DownloadRequest): DownloadItem | null {
    return findDuplicate(req.url, this.formatLabel(req.options));
  }

  /** Start as many queued jobs as the concurrency limit allows. */
  private pump(): void {
    const limit = readSettings().concurrentLimit;
    const running = [...this.jobs.values()].filter(
      (j) => j.item.status === 'downloading' || j.item.status === 'processing',
    ).length;

    let slots = limit - running;
    while (slots > 0 && this.queue.length > 0) {
      const id = this.queue.shift()!;
      const job = this.jobs.get(id);
      if (!job || job.item.status !== 'queued') continue;
      this.startJob(job);
      slots--;
    }
  }

  private startJob(job: ActiveJob): void {
    const s = readSettings();
    // Per-job override > kind-specific subfolder > global download dir.
    const baseDir = job.outputDir ?? s.downloadDir;
    const outDir = job.item.kind === 'thumbnail' ? join(baseDir, 'thumbnails') : baseDir;
    if (s.autoCreateFolders && !existsSync(outDir)) {
      mkdirSync(outDir, { recursive: true });
    }

    const reqOpts = this.optionsFor(job.item);
    const bin = resolveBinary('yt-dlp', s.ytDlpPath);
    const args = this.buildArgs(job, reqOpts, outDir);

    log.info('start', job.item.id, job.item.formatLabel);
    job.item.status = 'downloading';
    this.persist(job.item);

    const proc = spawn(bin, args, { windowsHide: true });
    job.proc = proc;

    proc.stdout.on('data', (buf: Buffer) => this.handleOutput(job, buf.toString()));
    proc.stderr.on('data', (buf: Buffer) => {
      const text = buf.toString();
      // yt-dlp prints warnings + info to stderr too. Only treat a line as a
      // fatal error when it is explicitly prefixed "ERROR:" (yt-dlp) so we don't
      // misclassify benign lines (e.g. anything merely mentioning "ffmpeg").
      if (/^\s*ERROR:/im.test(text)) job.item.error = humanizeError(text);
      this.handleOutput(job, text);
    });

    proc.on('close', (code, signal) => this.handleClose(job, code, signal));
    proc.on('error', (err) => {
      job.item.status = 'failed';
      job.item.error = err.message;
      this.persist(job.item);
      this.pump();
    });
  }

  /** Store the original request options on the item so retries are exact. */
  private optionsByItem = new Map<string, DownloadOptions>();

  private optionsFor(item: DownloadItem): DownloadOptions {
    const cached = this.optionsByItem.get(item.id);
    if (cached) return cached;
    // Fallback reconstruction (should rarely happen): default video best.
    return { kind: 'video', quality: 'best', container: 'mp4' };
  }

  /** Public enqueue stores the options so the manager can rebuild args later. */
  registerOptions(id: string, opts: DownloadOptions): void {
    this.optionsByItem.set(id, opts);
  }

  private progressRegex =
    /\[download\]\s+([\d.]+)%(?:\s+of\s+~?\s*([\d.]+\s*\w+))?(?:\s+at\s+([\d.]+\s*\w+\/s))?(?:\s+ETA\s+([\d:]+))?/;

  private handleOutput(job: ActiveJob, text: string): void {
    for (const line of text.split('\n')) {
      // Capture the final muxed/destination path.
      const dest = line.match(/\[(?:download|Merger|ExtractAudio|download)\].*?Destination:\s+(.+)/);
      if (dest?.[1]) job.resolvedPath = dest[1].trim();
      const merge = line.match(/Merging formats into "(.+)"/);
      if (merge?.[1]) job.resolvedPath = merge[1].trim();

      // Post-processing phase (ffmpeg muxing / audio extraction).
      if (/\[(ExtractAudio|Merger|EmbedThumbnail|Metadata|VideoConvertor)\]/.test(line)) {
        if (job.item.status !== 'processing') {
          job.item.status = 'processing';
          job.item.progress.percent = Math.max(job.item.progress.percent, 99);
          this.persist(job.item);
        }
      }

      const m = line.match(this.progressRegex);
      if (m) {
        const progress: DownloadProgress = {
          percent: Math.min(100, parseFloat(m[1] ?? '0')),
          totalBytes: null,
          downloadedBytes: null,
          speed: m[3]?.trim() ?? null,
          eta: m[4]?.trim() ?? null,
        };
        job.item.progress = progress;
        if (job.item.status === 'queued') job.item.status = 'downloading';
        // Throttle high-frequency progress to ~5 fps per job. This caps IPC
        // traffic and renderer re-renders even with many concurrent downloads.
        // 100% always flushes so the bar visibly reaches the end.
        const now = Date.now();
        if (progress.percent >= 100 || now - job.lastEmit >= 200) {
          job.lastEmit = now;
          this.emitUpdate(job.item);
        }
      }
    }
  }

  private handleClose(job: ActiveJob, code: number | null, signal: NodeJS.Signals | null): void {
    job.proc = null;
    if (job.item.status === 'canceled') {
      // already handled by cancel()
    } else if (job.item.status === 'paused') {
      // resume() will re-enqueue; leave as paused
    } else if (code === 0) {
      job.item.status = 'completed';
      job.item.progress.percent = 100;
      job.item.filePath = job.resolvedPath;
      job.item.completedAt = Date.now();
      try {
        if (job.resolvedPath && existsSync(job.resolvedPath)) {
          job.item.fileSize = statSync(job.resolvedPath).size;
        }
      } catch {
        /* ignore size lookup errors */
      }
      log.info('completed', job.item.id, job.item.filePath);
    } else {
      job.item.status = 'failed';
      job.item.error ??= humanizeError(
        `yt-dlp exited with code ${code}${signal ? ` (${signal})` : ''}`,
      );
      log.warn('failed', job.item.id, job.item.error);
    }
    this.persist(job.item);
    this.pump();
  }

  /* --------------------------- queue controls --------------------------- */

  pause(id: string): void {
    const job = this.jobs.get(id);
    if (!job) return;
    if (job.item.status === 'downloading' || job.item.status === 'processing') {
      job.item.status = 'paused';
      job.proc?.kill('SIGTERM'); // yt-dlp supports .part resume on restart
      this.persist(job.item);
      this.pump();
    } else if (job.item.status === 'queued') {
      job.item.status = 'paused';
      this.queue = this.queue.filter((q) => q !== id);
      this.persist(job.item);
    }
  }

  resume(id: string): void {
    const job = this.jobs.get(id);
    if (!job || job.item.status !== 'paused') return;
    job.item.status = 'queued';
    job.item.error = null;
    this.persist(job.item);
    if (!this.queue.includes(id)) this.queue.unshift(id);
    this.pump();
  }

  cancel(id: string): void {
    const job = this.jobs.get(id);
    if (!job) return;
    job.item.status = 'canceled';
    job.proc?.kill('SIGTERM');
    this.queue = this.queue.filter((q) => q !== id);
    this.persist(job.item);
    this.pump();
  }

  retry(id: string): void {
    const job = this.jobs.get(id);
    if (!job) return;
    if (job.item.status !== 'failed' && job.item.status !== 'canceled') return;
    job.item.status = 'queued';
    job.item.error = null;
    job.item.progress = { percent: 0, speed: null, eta: null, downloadedBytes: null, totalBytes: null };
    this.persist(job.item);
    if (!this.queue.includes(id)) this.queue.push(id);
    this.pump();
  }

  remove(id: string): void {
    const job = this.jobs.get(id);
    if (job?.proc) job.proc.kill('SIGTERM');
    this.jobs.delete(id);
    this.optionsByItem.delete(id);
    removeDownload(id);
  }

  list(): DownloadItem[] {
    return [...this.jobs.values()].map((j) => j.item).sort((a, b) => b.createdAt - a.createdAt);
  }

  /** Kill everything on app quit. */
  shutdown(): void {
    for (const job of this.jobs.values()) job.proc?.kill('SIGTERM');
  }

  /* ------------------------------ emit/db ------------------------------- */

  private persist(item: DownloadItem): void {
    upsertDownload(item);
    this.emitUpdate(item);
  }

  private emitUpdate(item: DownloadItem): void {
    this.emit('progress', { ...item });
  }
}

export const downloadManager = new DownloadManager();
