var re = Object.defineProperty;
var le = (t, i, e) => i in t ? re(t, i, { enumerable: !0, configurable: !0, writable: !0, value: e }) : t[i] = e;
var L = (t, i, e) => le(t, typeof i != "symbol" ? i + "" : i, e);
import { app as m, ipcMain as u, clipboard as ue, shell as U, dialog as W, BrowserWindow as V } from "electron";
import { join as g, dirname as ce } from "node:path";
import { fileURLToPath as de } from "node:url";
import me from "better-sqlite3";
import { mkdirSync as x, createWriteStream as pe, existsSync as D, statSync as fe } from "node:fs";
import { execFile as K, spawn as he } from "node:child_process";
import { promisify as Z } from "node:util";
import { EventEmitter as ge } from "node:events";
import { randomUUID as Ee } from "node:crypto";
import be from "electron-updater";
let S = null;
function we() {
  if (S) return S;
  try {
    const t = g(m.getPath("userData"), "logs");
    return x(t, { recursive: !0 }), S = pe(g(t, "mediavault.log"), { flags: "a" }), S;
  } catch {
    return null;
  }
}
function A(t, i, e, ...n) {
  const s = `[${(/* @__PURE__ */ new Date()).toISOString()}] [${t.toUpperCase()}] [${i}] ${String(
    e
  )} ${n.map((r) => typeof r == "object" ? JSON.stringify(r) : String(r)).join(" ")}`.trim();
  (console[t === "debug" ? "log" : t] ?? console.log)(s);
  const o = we();
  o == null || o.write(s + `
`);
}
function O(t) {
  return {
    info: (i, ...e) => A("info", t, i, ...e),
    warn: (i, ...e) => A("warn", t, i, ...e),
    error: (i, ...e) => A("error", t, i, ...e),
    debug: (i, ...e) => A("debug", t, i, ...e)
  };
}
const ye = O("db");
let E;
function Te() {
  const t = m.getPath("userData");
  x(t, { recursive: !0 });
  const i = g(t, "mediavault.db");
  E = new me(i), E.pragma("journal_mode = WAL"), E.pragma("synchronous = NORMAL"), E.exec(`
    CREATE TABLE IF NOT EXISTS downloads (
      id           TEXT PRIMARY KEY,
      url          TEXT NOT NULL,
      title        TEXT NOT NULL,
      thumbnail    TEXT,
      channel      TEXT,
      kind         TEXT NOT NULL,
      format_label TEXT NOT NULL,
      status       TEXT NOT NULL,
      file_path    TEXT,
      file_size    INTEGER,
      error        TEXT,
      created_at   INTEGER NOT NULL,
      completed_at INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_downloads_created ON downloads(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_downloads_status  ON downloads(status);

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `), ye.info("database ready at", i);
}
function $(t) {
  E.prepare(
    `INSERT INTO downloads
       (id, url, title, thumbnail, channel, kind, format_label, status, file_path, file_size, error, created_at, completed_at)
     VALUES
       (@id, @url, @title, @thumbnail, @channel, @kind, @formatLabel, @status, @filePath, @fileSize, @error, @createdAt, @completedAt)
     ON CONFLICT(id) DO UPDATE SET
       status       = excluded.status,
       file_path    = excluded.file_path,
       file_size    = excluded.file_size,
       error        = excluded.error,
       completed_at = excluded.completed_at`
  ).run({
    id: t.id,
    url: t.url,
    title: t.title,
    thumbnail: t.thumbnail,
    channel: t.channel,
    kind: t.kind,
    formatLabel: t.formatLabel,
    status: t.status,
    filePath: t.filePath,
    fileSize: t.fileSize,
    error: t.error,
    createdAt: t.createdAt,
    completedAt: t.completedAt
  });
}
function J(t) {
  return {
    id: t.id,
    url: t.url,
    title: t.title,
    thumbnail: t.thumbnail,
    channel: t.channel,
    kind: t.kind,
    formatLabel: t.format_label,
    status: t.status,
    progress: {
      percent: t.status === "completed" ? 100 : 0,
      speed: null,
      eta: null,
      downloadedBytes: t.file_size,
      totalBytes: t.file_size
    },
    filePath: t.file_path,
    fileSize: t.file_size,
    error: t.error,
    createdAt: t.created_at,
    completedAt: t.completed_at
  };
}
function _e(t = 500) {
  return E.prepare("SELECT * FROM downloads ORDER BY created_at DESC LIMIT ?").all(t).map(J);
}
function De(t, i) {
  const e = E.prepare(
    "SELECT * FROM downloads WHERE url = ? AND format_label = ? AND status = 'completed' LIMIT 1"
  ).get(t, i);
  return e ? J(e) : null;
}
function Oe(t) {
  E.prepare("DELETE FROM downloads WHERE id = ?").run(t);
}
function Le() {
  E.prepare("DELETE FROM downloads WHERE status IN ('completed','failed','canceled')").run();
}
function ve() {
  const t = E.prepare("SELECT COUNT(*) c, COALESCE(SUM(file_size),0) b FROM downloads WHERE status='completed'").get(), i = E.prepare("SELECT kind, COUNT(*) c FROM downloads WHERE status='completed' GROUP BY kind").all(), e = new Map(i.map((n) => [n.kind, n.c]));
  return {
    totalDownloads: t.c,
    totalVideos: e.get("video") ?? 0,
    totalAudio: e.get("audio") ?? 0,
    totalThumbnails: e.get("thumbnail") ?? 0,
    totalBytes: t.b
  };
}
function Se(t) {
  const i = E.prepare("SELECT value FROM settings WHERE key = ?").get(t);
  return (i == null ? void 0 : i.value) ?? null;
}
function Ae(t, i) {
  E.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(t, i);
}
const l = {
  // media analysis
  ANALYZE_URL: "media:analyze",
  ANALYZE_PLAYLIST: "media:analyzePlaylist",
  // downloads
  DOWNLOAD_START: "download:start",
  DOWNLOAD_CHECK_DUPLICATE: "download:checkDuplicate",
  DOWNLOAD_PAUSE: "download:pause",
  DOWNLOAD_RESUME: "download:resume",
  DOWNLOAD_CANCEL: "download:cancel",
  DOWNLOAD_RETRY: "download:retry",
  DOWNLOAD_REMOVE: "download:remove",
  DOWNLOAD_PROGRESS: "download:progress",
  // main -> renderer push
  DOWNLOAD_LIST: "download:list",
  DOWNLOAD_CLEAR_COMPLETED: "download:clearCompleted",
  // settings
  SETTINGS_GET: "settings:get",
  SETTINGS_SET: "settings:set",
  // file management
  FILE_OPEN_LOCATION: "file:openLocation",
  FILE_OPEN: "file:open",
  PICK_DIRECTORY: "dialog:pickDirectory",
  PICK_FILE: "dialog:pickFile",
  // system
  DEPS_CHECK: "system:depsCheck",
  STATS_GET: "stats:get",
  CLIPBOARD_URL: "clipboard:url",
  // main -> renderer push
  // updater
  UPDATE_STATUS: "update:status",
  // main -> renderer push
  UPDATE_CHECK: "update:check",
  UPDATE_INSTALL: "update:install",
  // window controls
  WINDOW_MINIMIZE: "window:minimize",
  WINDOW_MAXIMIZE: "window:maximize",
  WINDOW_CLOSE: "window:close"
}, Ie = Z(K), Ne = process.platform === "win32";
function Q() {
  if (m.isPackaged)
    return g(process.resourcesPath, "bin");
  const t = process.platform === "win32" ? "win" : process.platform === "darwin" ? "mac" : "linux";
  return g(m.getAppPath(), "resources", "bin", t);
}
function N(t) {
  return Ne ? `${t}.exe` : t;
}
function j(t, i) {
  if (t !== "ffprobe" || !i) return i ?? null;
  const e = i.replace(/[\\/][^\\/]*$/, ""), n = g(e, N("ffprobe"));
  return D(n) ? n : null;
}
function v(t, i) {
  const e = t === "ffprobe" ? j(t, i) : i;
  if (e && D(e)) return e;
  const n = g(Q(), N(t));
  return D(n) ? n : N(t);
}
function B(t, i) {
  const e = t === "ffprobe" ? j(t, i) : i;
  if (e && D(e)) return e;
  const n = g(Q(), N(t));
  return D(n) ? n : null;
}
async function R(t, i, e = 2) {
  for (let n = 0; n < e; n++)
    try {
      const { stdout: s, stderr: o } = await Ie(t, i, {
        timeout: 2e4,
        windowsHide: !0
      }), r = (s || o || "").trim();
      if (r) return r.split(`
`)[0] ?? null;
    } catch {
      n < e - 1 && await new Promise((s) => setTimeout(s, 250));
    }
  return null;
}
const ee = "app_settings";
function C() {
  return {
    downloadDir: g(m.getPath("downloads"), "MediaVault"),
    theme: "dark",
    ffmpegPath: null,
    ytDlpPath: null,
    concurrentLimit: 3,
    language: "en",
    autoCreateFolders: !0,
    clipboardDetection: !0,
    embedThumbnail: !0,
    embedMetadata: !0,
    defaultVideoQuality: "1080",
    defaultVideoContainer: "mp4",
    defaultAudioFormat: "mp3",
    defaultAudioBitrate: "320"
  };
}
function _() {
  const t = Se(ee);
  if (!t) return C();
  try {
    return { ...C(), ...JSON.parse(t) };
  } catch {
    return C();
  }
}
function Pe(t) {
  const i = { ..._(), ...t };
  return i.concurrentLimit = Math.min(10, Math.max(1, Math.floor(i.concurrentLimit))), Ae(ee, JSON.stringify(i)), i;
}
const Re = [
  { test: /age[- ]?restrict|confirm your age|inappropriate for some users|sign in to confirm your age/i, message: "This video is age-restricted and cannot be downloaded without authentication." },
  { test: /private video|this video is private/i, message: "This video is private." },
  { test: /video unavailable|has been removed|no longer available|account.*terminated/i, message: "This video is unavailable or has been removed." },
  { test: /not available in your country|geo|blocked it in your country/i, message: "This video is geo-blocked in your region." },
  { test: /members[- ]only|join this channel/i, message: "This is a members-only video." },
  { test: /premiere|will begin in|live event will begin/i, message: "This is a scheduled premiere or upcoming live stream." },
  { test: /copyright|claimed by/i, message: "This video is blocked due to a copyright claim." },
  // IMPORTANT: only match a GENUINE "ffmpeg not found" condition. A naive
  // /ffmpeg/ alternative matched ANY line mentioning ffmpeg (even success/info
  // lines), causing false "FFmpeg was not found" errors on working downloads.
  { test: /(ffmpeg|ffprobe)\b[^\n]*\b(not found|is not installed|could not be found)|cannot find ffmpeg|ffmpeg not found|please install ffmpeg|you have requested merging.*but ffmpeg|enoent[^\n]*ffmpeg/i, message: "FFmpeg was not found. Set its path in Settings to enable merging and conversion." },
  { test: /yt-dlp[^\n]*not found|enoent[^\n]*yt-dlp/i, message: "yt-dlp was not found. Set its path in Settings." },
  { test: /no space left|disk full|enospc/i, message: "Download failed: the disk is full." },
  { test: /permission denied|eacces|eperm/i, message: "Permission denied. Choose a different download folder in Settings." },
  { test: /unable to download|http error 4\d\d|http error 5\d\d/i, message: "Network error while downloading. Please retry." },
  { test: /unable to resolve host|getaddrinfo|network is unreachable|timed? out/i, message: "No internet connection or the request timed out." },
  { test: /requested format (is )?not available|requested format not available/i, message: 'The selected quality/format is not available for this video. Try "Best Available".' },
  { test: /unsupported url|is not a valid url/i, message: "That URL is not supported." }
];
function P(t) {
  if (!t) return "An unknown error occurred.";
  const i = t.replace(/\u001b\[[0-9;]*m/g, "").trim();
  for (const n of Re)
    if (n.test.test(i)) return n.message;
  const e = i.split(`
`).reverse().find((n) => /error/i.test(n));
  return e ? e.replace(/^.*?ERROR:\s*/i, "").slice(0, 240) || "Download failed." : i.slice(0, 240) || "Download failed.";
}
const te = Z(K), ne = O("ytdlp");
function ie() {
  const t = _();
  return { bin: v("yt-dlp", t.ytDlpPath), common: [
    "--no-warnings",
    "--no-playlist",
    // overridden explicitly for playlist calls
    "--no-call-home"
  ] };
}
function Ce(t) {
  return !t || t.length !== 8 ? null : `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}`;
}
function ke(t) {
  const i = t.height ?? 0;
  return i >= 1080 ? "Original" : i >= 720 ? "Max Resolution" : i >= 360 ? "High" : i >= 180 ? "Medium" : "Default";
}
function Ue(t = []) {
  return t.filter((i) => !!i.url).map((i, e) => ({
    id: i.id ?? String(e),
    url: i.url,
    width: i.width ?? null,
    height: i.height ?? null,
    label: ke(i)
  })).sort((i, e) => (i.height ?? 0) - (e.height ?? 0));
}
function Me(t = []) {
  return t.filter((i) => i.format_id).map((i) => {
    const e = (i.vcodec ?? "none") !== "none" && (i.acodec ?? "none") === "none", n = (i.vcodec ?? "none") === "none" && (i.acodec ?? "none") !== "none";
    return {
      formatId: i.format_id,
      ext: i.ext,
      resolution: i.resolution ?? (i.height ? `${i.height}p` : "audio"),
      height: i.height ?? null,
      width: i.width ?? null,
      fps: i.fps ?? null,
      filesize: i.filesize ?? i.filesize_approx ?? null,
      vcodec: i.vcodec ?? null,
      acodec: i.acodec ?? null,
      tbr: i.tbr ?? null,
      videoOnly: e,
      audioOnly: n,
      note: i.format_note ?? null
    };
  });
}
function q(t = {}, i) {
  const e = [];
  for (const [n, s] of Object.entries(t)) {
    const o = s[0];
    o && e.push({
      lang: n,
      langName: o.name ?? n,
      ext: o.ext,
      url: o.url,
      auto: i
    });
  }
  return e;
}
function xe(t = []) {
  const i = /* @__PURE__ */ new Set(), e = [];
  for (const n of t) {
    if ((n.acodec ?? "none") === "none" || (n.vcodec ?? "none") !== "none") continue;
    const s = n.format_note ?? n.format_id;
    i.has(s) || (i.add(s), e.push({ id: n.format_id, lang: null, note: n.format_note ?? null }));
  }
  return e;
}
function Fe(t) {
  var n;
  const i = q(t.subtitles, !1), e = q(t.automatic_captions, !0);
  return {
    id: t.id,
    url: t.webpage_url ?? t.original_url ?? "",
    title: t.title,
    description: t.description ?? null,
    channel: t.channel ?? t.uploader ?? null,
    channelId: t.channel_id ?? null,
    channelUrl: t.channel_url ?? null,
    uploader: t.uploader ?? null,
    subscriberCount: t.channel_follower_count ?? null,
    uploadDate: Ce(t.upload_date),
    duration: t.duration ?? null,
    durationString: t.duration_string ?? null,
    viewCount: t.view_count ?? null,
    likeCount: t.like_count ?? null,
    commentCount: t.comment_count ?? null,
    category: ((n = t.categories) == null ? void 0 : n[0]) ?? null,
    tags: t.tags ?? [],
    language: t.language ?? null,
    isLive: t.is_live ?? !1,
    ageLimit: t.age_limit ?? 0,
    thumbnails: Ue(t.thumbnails),
    formats: Me(t.formats),
    subtitles: [...i, ...e],
    audioTracks: xe(t.formats)
  };
}
async function ze(t) {
  const { bin: i } = ie(), e = [
    "--dump-single-json",
    "--no-warnings",
    "--no-playlist",
    t
  ];
  ne.info("analyze", t);
  try {
    const { stdout: n } = await te(i, e, {
      maxBuffer: 67108864,
      timeout: 6e4
    }), s = JSON.parse(n);
    return Fe(s);
  } catch (n) {
    const s = n.stderr ?? n.message;
    throw new Error(P(s));
  }
}
async function We(t) {
  var r, p, b;
  const { bin: i } = ie(), e = [
    "--dump-single-json",
    "--flat-playlist",
    "--no-warnings",
    "--yes-playlist",
    t
  ];
  ne.info("analyze playlist", t);
  let n;
  try {
    const { stdout: a } = await te(i, e, {
      maxBuffer: 134217728,
      timeout: 12e4
    });
    n = JSON.parse(a);
  } catch (a) {
    const d = a.stderr ?? a.message;
    throw new Error(P(d));
  }
  const s = (n.entries ?? []).map((a) => {
    var d, w;
    return {
      id: a.id,
      url: a.webpage_url ?? `https://www.youtube.com/watch?v=${a.id}`,
      title: a.title,
      duration: a.duration ?? null,
      durationString: a.duration_string ?? null,
      thumbnail: ((w = (d = a.thumbnails) == null ? void 0 : d[0]) == null ? void 0 : w.url) ?? null,
      uploader: a.uploader ?? a.channel ?? null
    };
  }), o = ((p = (r = n.thumbnails) == null ? void 0 : r.at(-1)) == null ? void 0 : p.url) ?? ((b = s.find((a) => a.thumbnail)) == null ? void 0 : b.thumbnail) ?? null;
  return {
    id: n.id,
    title: n.title,
    uploader: n.uploader ?? n.channel ?? null,
    thumbnail: o,
    entryCount: n.playlist_count ?? s.length,
    entries: s
  };
}
const $e = /* @__PURE__ */ new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be"
]);
function M(t) {
  const i = t.trim();
  if (!i) return { valid: !1, isPlaylist: !1, normalized: null, reason: "Empty URL" };
  let e;
  try {
    e = new URL(i);
  } catch {
    return { valid: !1, isPlaylist: !1, normalized: null, reason: "Malformed URL" };
  }
  if (e.protocol !== "http:" && e.protocol !== "https:")
    return { valid: !1, isPlaylist: !1, normalized: null, reason: "Unsupported protocol" };
  if (!$e.has(e.hostname))
    return { valid: !1, isPlaylist: !1, normalized: null, reason: "Not a YouTube URL" };
  const n = e.searchParams.has("list"), s = e.pathname.startsWith("/playlist"), o = s || n && !e.searchParams.has("v") && !e.pathname.startsWith("/watch");
  return e.protocol = "https:", {
    valid: !0,
    isPlaylist: s ? !0 : o,
    normalized: e.toString()
  };
}
function Be(t) {
  const i = t.match(
    /https?:\/\/(?:www\.|m\.|music\.)?(?:youtube\.com|youtu\.be)\/[^\s'"<>]+/i
  );
  if (!i) return null;
  const e = M(i[0]);
  return e.valid ? e.normalized : null;
}
function qe(t) {
  return t.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").replace(/\s+/g, " ").replace(/^\.+/, "").trim().slice(0, 180) || "mediavault_download";
}
const k = O("downloads");
class Ye extends ge {
  constructor() {
    super(...arguments);
    L(this, "jobs", /* @__PURE__ */ new Map());
    L(this, "queue", []);
    /** Store the original request options on the item so retries are exact. */
    L(this, "optionsByItem", /* @__PURE__ */ new Map());
    L(this, "progressRegex", /\[download\]\s+([\d.]+)%(?:\s+of\s+~?\s*([\d.]+\s*\w+))?(?:\s+at\s+([\d.]+\s*\w+\/s))?(?:\s+ETA\s+([\d:]+))?/);
  }
  // ids waiting to start
  /** Build a human-readable label used in the UI + duplicate detection. */
  formatLabel(e) {
    switch (e.kind) {
      case "video":
        return `${e.quality === "best" ? "Best" : e.quality + "p"} ${e.container.toUpperCase()}`;
      case "audio":
        return `${e.format.toUpperCase()} ${e.bitrate === "best" ? "Best" : e.bitrate + "kbps"}`;
      case "thumbnail":
        return `Thumbnail (${e.thumbnailLabel})`;
      case "subtitle":
        return `Subtitle ${e.lang.toUpperCase()} ${e.format.toUpperCase()}`;
    }
  }
  /** Translate quality + container into a yt-dlp -f format selector. */
  videoFormatSelector(e, n) {
    const s = e === "best" ? null : Number(e);
    return ["-f", s ? `bestvideo[height<=${s}]+bestaudio/best[height<=${s}]` : "bestvideo+bestaudio/best", "--merge-output-format", n];
  }
  buildArgs(e, n, s) {
    var z;
    const { item: o } = e, r = _(), p = B("ffmpeg", r.ffmpegPath), a = B("ffprobe", r.ffmpegPath) !== null || p === null, d = qe(((z = e.customName) == null ? void 0 : z.trim()) || o.title), f = [
      "--no-warnings",
      "--no-playlist",
      "--newline",
      // one progress line per write -> easy to parse
      "--progress",
      "-o",
      g(s, `${d}.%(ext)s`)
    ];
    switch (p && f.push("--ffmpeg-location", p), n.kind) {
      case "video": {
        f.push(...this.videoFormatSelector(n.quality, n.container)), r.embedThumbnail && a && f.push("--embed-thumbnail"), r.embedMetadata && a && f.push("--embed-metadata"), f.push(o.url);
        break;
      }
      case "audio": {
        const oe = n.format === "ogg" ? "vorbis" : n.format;
        f.push("-x", "--audio-format", oe), n.bitrate !== "best" && f.push("--audio-quality", `${n.bitrate}K`);
        const ae = /* @__PURE__ */ new Set(["mp3", "m4a"]);
        r.embedThumbnail && a && ae.has(n.format) && f.push("--embed-thumbnail"), r.embedMetadata && a && f.push("--embed-metadata"), f.push(o.url);
        break;
      }
      case "thumbnail": {
        f.length = 0, f.push("--no-warnings", "-o", g(s, `${d}_thumb.%(ext)s`)), f.push(n.thumbnailUrl);
        break;
      }
      case "subtitle": {
        f.push(
          "--skip-download",
          n.auto ? "--write-auto-subs" : "--write-subs",
          "--sub-langs",
          n.lang,
          "--convert-subs",
          n.format === "txt" ? "srt" : n.format,
          o.url
        );
        break;
      }
    }
    return f;
  }
  /** Enqueue a new download and try to start it immediately. */
  enqueue(e) {
    const n = this.formatLabel(e.options), s = {
      id: Ee(),
      url: e.url,
      title: e.title,
      thumbnail: e.thumbnail,
      channel: e.channel,
      kind: e.options.kind,
      formatLabel: n,
      status: "queued",
      progress: { percent: 0, speed: null, eta: null, downloadedBytes: null, totalBytes: null },
      filePath: null,
      fileSize: null,
      error: null,
      createdAt: Date.now(),
      completedAt: null
    };
    return this.jobs.set(s.id, {
      item: s,
      proc: null,
      resolvedPath: null,
      customName: e.customName ?? null,
      outputDir: e.outputDir ?? null,
      lastEmit: 0
    }), this.optionsByItem.set(s.id, e.options), $(s), this.queue.push(s.id), this.emitUpdate(s), this.pump(), s;
  }
  /** Check for an already-completed identical download. */
  checkDuplicate(e) {
    return De(e.url, this.formatLabel(e.options));
  }
  /** Start as many queued jobs as the concurrency limit allows. */
  pump() {
    const e = _().concurrentLimit, n = [...this.jobs.values()].filter(
      (o) => o.item.status === "downloading" || o.item.status === "processing"
    ).length;
    let s = e - n;
    for (; s > 0 && this.queue.length > 0; ) {
      const o = this.queue.shift(), r = this.jobs.get(o);
      !r || r.item.status !== "queued" || (this.startJob(r), s--);
    }
  }
  startJob(e) {
    const n = _(), s = e.outputDir ?? n.downloadDir, o = e.item.kind === "thumbnail" ? g(s, "thumbnails") : s;
    n.autoCreateFolders && !D(o) && x(o, { recursive: !0 });
    const r = this.optionsFor(e.item), p = v("yt-dlp", n.ytDlpPath), b = this.buildArgs(e, r, o);
    k.info("start", e.item.id, e.item.formatLabel), e.item.status = "downloading", this.persist(e.item);
    const a = he(p, b, { windowsHide: !0 });
    e.proc = a, a.stdout.on("data", (d) => this.handleOutput(e, d.toString())), a.stderr.on("data", (d) => {
      const w = d.toString();
      /^\s*ERROR:/im.test(w) && (e.item.error = P(w)), this.handleOutput(e, w);
    }), a.on("close", (d, w) => this.handleClose(e, d, w)), a.on("error", (d) => {
      e.item.status = "failed", e.item.error = d.message, this.persist(e.item), this.pump();
    });
  }
  optionsFor(e) {
    const n = this.optionsByItem.get(e.id);
    return n || { kind: "video", quality: "best", container: "mp4" };
  }
  /** Public enqueue stores the options so the manager can rebuild args later. */
  registerOptions(e, n) {
    this.optionsByItem.set(e, n);
  }
  handleOutput(e, n) {
    var s, o;
    for (const r of n.split(`
`)) {
      const p = r.match(/\[(?:download|Merger|ExtractAudio|download)\].*?Destination:\s+(.+)/);
      p != null && p[1] && (e.resolvedPath = p[1].trim());
      const b = r.match(/Merging formats into "(.+)"/);
      b != null && b[1] && (e.resolvedPath = b[1].trim()), /\[(ExtractAudio|Merger|EmbedThumbnail|Metadata|VideoConvertor)\]/.test(r) && e.item.status !== "processing" && (e.item.status = "processing", e.item.progress.percent = Math.max(e.item.progress.percent, 99), this.persist(e.item));
      const a = r.match(this.progressRegex);
      if (a) {
        const d = {
          percent: Math.min(100, parseFloat(a[1] ?? "0")),
          totalBytes: null,
          downloadedBytes: null,
          speed: ((s = a[3]) == null ? void 0 : s.trim()) ?? null,
          eta: ((o = a[4]) == null ? void 0 : o.trim()) ?? null
        };
        e.item.progress = d, e.item.status === "queued" && (e.item.status = "downloading");
        const w = Date.now();
        (d.percent >= 100 || w - e.lastEmit >= 200) && (e.lastEmit = w, this.emitUpdate(e.item));
      }
    }
  }
  handleClose(e, n, s) {
    var o;
    if (e.proc = null, e.item.status !== "canceled") {
      if (e.item.status !== "paused") if (n === 0) {
        e.item.status = "completed", e.item.progress.percent = 100, e.item.filePath = e.resolvedPath, e.item.completedAt = Date.now();
        try {
          e.resolvedPath && D(e.resolvedPath) && (e.item.fileSize = fe(e.resolvedPath).size);
        } catch {
        }
        k.info("completed", e.item.id, e.item.filePath);
      } else
        e.item.status = "failed", (o = e.item).error ?? (o.error = P(
          `yt-dlp exited with code ${n}${s ? ` (${s})` : ""}`
        )), k.warn("failed", e.item.id, e.item.error);
    }
    this.persist(e.item), this.pump();
  }
  /* --------------------------- queue controls --------------------------- */
  pause(e) {
    var s;
    const n = this.jobs.get(e);
    n && (n.item.status === "downloading" || n.item.status === "processing" ? (n.item.status = "paused", (s = n.proc) == null || s.kill("SIGTERM"), this.persist(n.item), this.pump()) : n.item.status === "queued" && (n.item.status = "paused", this.queue = this.queue.filter((o) => o !== e), this.persist(n.item)));
  }
  resume(e) {
    const n = this.jobs.get(e);
    !n || n.item.status !== "paused" || (n.item.status = "queued", n.item.error = null, this.persist(n.item), this.queue.includes(e) || this.queue.unshift(e), this.pump());
  }
  cancel(e) {
    var s;
    const n = this.jobs.get(e);
    n && (n.item.status = "canceled", (s = n.proc) == null || s.kill("SIGTERM"), this.queue = this.queue.filter((o) => o !== e), this.persist(n.item), this.pump());
  }
  retry(e) {
    const n = this.jobs.get(e);
    n && (n.item.status !== "failed" && n.item.status !== "canceled" || (n.item.status = "queued", n.item.error = null, n.item.progress = { percent: 0, speed: null, eta: null, downloadedBytes: null, totalBytes: null }, this.persist(n.item), this.queue.includes(e) || this.queue.push(e), this.pump()));
  }
  remove(e) {
    const n = this.jobs.get(e);
    n != null && n.proc && n.proc.kill("SIGTERM"), this.jobs.delete(e), this.optionsByItem.delete(e), Oe(e);
  }
  list() {
    return [...this.jobs.values()].map((e) => e.item).sort((e, n) => n.createdAt - e.createdAt);
  }
  /** Kill everything on app quit. */
  shutdown() {
    var e;
    for (const n of this.jobs.values()) (e = n.proc) == null || e.kill("SIGTERM");
  }
  /* ------------------------------ emit/db ------------------------------- */
  persist(e) {
    $(e), this.emitUpdate(e);
  }
  emitUpdate(e) {
    this.emit("progress", { ...e });
  }
}
const T = new Ye(), Y = {
  ytDlp: null,
  ffmpeg: null
};
async function Ge() {
  const t = _(), i = v("yt-dlp", t.ytDlpPath), e = v("ffmpeg", t.ffmpegPath), n = v("ffprobe", t.ffmpegPath), [s, o, r] = await Promise.all([
    R(i, ["--version"]),
    R(e, ["-version"]),
    R(n, ["-version"])
  ]), p = o ? o.replace(/^ffmpeg version\s*/i, "").split(" ")[0] ?? o : null, b = G("ytDlp", i, s), a = G("ffmpeg", e, p && r ? p : null);
  return { ytDlp: b, ffmpeg: a };
}
function G(t, i, e) {
  if (e)
    return Y[t] = { path: i, version: e }, { available: !0, version: e, path: i };
  const n = Y[t];
  return n && n.path === i ? { available: !0, version: n.version, path: i } : { available: !1, version: null, path: i };
}
const { autoUpdater: y } = be, I = O("updater");
function He(t) {
  if (!m.isPackaged) {
    I.info("updater disabled in dev");
    return;
  }
  y.autoDownload = !0, y.autoInstallOnAppQuit = !0;
  const i = (e) => {
    t.isDestroyed() || t.webContents.send(l.UPDATE_STATUS, e);
  };
  y.on("checking-for-update", () => i({ status: "checking" })), y.on("update-available", (e) => i({ status: "available", version: e.version })), y.on("update-not-available", () => i({ status: "not-available" })), y.on(
    "download-progress",
    (e) => i({ status: "downloading", percent: Math.round(e.percent) })
  ), y.on("update-downloaded", (e) => i({ status: "ready", version: e.version })), y.on("error", (e) => i({ status: "error", message: e.message })), setTimeout(() => y.checkForUpdates().catch((e) => I.warn(e)), 5e3), setInterval(() => y.checkForUpdates().catch((e) => I.warn(e)), 6 * 60 * 60 * 1e3);
}
function Xe() {
  m.isPackaged && y.checkForUpdates().catch((t) => I.warn(t));
}
function Ve() {
  m.isPackaged && y.quitAndInstall();
}
const Ke = O("ipc");
function c(t) {
  return async (...i) => {
    try {
      return { ok: !0, data: await t(...i) };
    } catch (e) {
      const n = e instanceof Error ? e.message : String(e);
      return Ke.error("handler failed", n), { ok: !1, error: n };
    }
  };
}
function Ze(t) {
  u.handle(
    l.ANALYZE_URL,
    c(async (e, n) => {
      const s = M(n);
      if (!s.valid || !s.normalized) throw new Error(s.reason ?? "Invalid URL");
      return ze(s.normalized);
    })
  ), u.handle(
    l.ANALYZE_PLAYLIST,
    c(async (e, n) => {
      const s = M(n);
      if (!s.valid || !s.normalized) throw new Error(s.reason ?? "Invalid URL");
      return We(s.normalized);
    })
  ), u.handle(
    l.DOWNLOAD_START,
    c(async (e, n) => {
      const s = T.enqueue(n);
      return T.registerOptions(s.id, n.options), s;
    })
  ), u.handle(
    l.DOWNLOAD_CHECK_DUPLICATE,
    c(async (e, n) => T.checkDuplicate(n))
  ), u.handle(l.DOWNLOAD_PAUSE, c(async (e, n) => T.pause(n))), u.handle(l.DOWNLOAD_RESUME, c(async (e, n) => T.resume(n))), u.handle(l.DOWNLOAD_CANCEL, c(async (e, n) => T.cancel(n))), u.handle(l.DOWNLOAD_RETRY, c(async (e, n) => T.retry(n))), u.handle(l.DOWNLOAD_REMOVE, c(async (e, n) => T.remove(n))), u.handle(
    l.DOWNLOAD_LIST,
    c(async () => {
      const e = T.list(), n = new Set(e.map((o) => o.id)), s = _e().filter((o) => !n.has(o.id));
      return [...e, ...s];
    })
  ), u.handle(
    l.DOWNLOAD_CLEAR_COMPLETED,
    c(async () => (Le(), !0))
  ), u.handle(l.SETTINGS_GET, c(async () => _())), u.handle(
    l.SETTINGS_SET,
    c(async (e, n) => Pe(n))
  ), u.handle(
    l.FILE_OPEN_LOCATION,
    c(async (e, n) => (U.showItemInFolder(n), !0))
  ), u.handle(
    l.FILE_OPEN,
    c(async (e, n) => {
      const s = await U.openPath(n);
      if (s) throw new Error(s);
      return !0;
    })
  ), u.handle(
    l.PICK_DIRECTORY,
    c(async () => {
      const e = t(), n = await W.showOpenDialog(e, { properties: ["openDirectory", "createDirectory"] });
      return n.canceled ? null : n.filePaths[0] ?? null;
    })
  ), u.handle(
    l.PICK_FILE,
    c(async () => {
      const e = t(), n = await W.showOpenDialog(e, { properties: ["openFile"] });
      return n.canceled ? null : n.filePaths[0] ?? null;
    })
  ), u.handle(l.DEPS_CHECK, c(async () => Ge())), u.handle(l.STATS_GET, c(async () => ve())), u.handle(l.UPDATE_CHECK, c(async () => (Xe(), !0))), u.handle(l.UPDATE_INSTALL, c(async () => (Ve(), !0))), u.on(l.WINDOW_MINIMIZE, () => {
    var e;
    return (e = t()) == null ? void 0 : e.minimize();
  }), u.on(l.WINDOW_MAXIMIZE, () => {
    const e = t();
    e && (e.isMaximized() ? e.unmaximize() : e.maximize());
  }), u.on(l.WINDOW_CLOSE, () => {
    var e;
    return (e = t()) == null ? void 0 : e.close();
  }), T.on("progress", (e) => {
    const n = t();
    n && !n.isDestroyed() && n.webContents.send(l.DOWNLOAD_PROGRESS, e);
  });
  let i = "";
  setInterval(() => {
    if (!_().clipboardDetection) return;
    const e = ue.readText();
    if (e && e !== i) {
      i = e;
      const n = Be(e);
      if (n) {
        const s = t();
        s && !s.isDestroyed() && s.webContents.send(l.CLIPBOARD_URL, n);
      }
    }
  }, 1500);
}
const F = O("main"), se = ce(de(import.meta.url)), H = process.env.VITE_DEV_SERVER_URL, Je = g(se, "../../dist"), Qe = g(se, "../preload/index.mjs");
let h = null;
const je = () => h, et = m.requestSingleInstanceLock();
et || m.quit();
function X() {
  h = new V({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    show: !1,
    frame: !1,
    // custom titlebar for the premium look
    titleBarStyle: "hiddenInset",
    backgroundColor: "#0b0b12",
    webPreferences: {
      preload: Qe,
      contextIsolation: !0,
      // security: isolate preload from renderer
      nodeIntegration: !1,
      // security: no node in renderer
      sandbox: !1,
      // preload needs limited node for the bridge
      webSecurity: !0
    }
  }), h.once("ready-to-show", () => h == null ? void 0 : h.show()), h.webContents.setWindowOpenHandler(({ url: t }) => (t.startsWith("https:") && U.openExternal(t), { action: "deny" })), H ? (h.loadURL(H), h.webContents.openDevTools({ mode: "detach" })) : h.loadFile(g(Je, "index.html")), He(h);
}
m.whenReady().then(() => {
  Te(), _(), Ze(je), X(), m.on("second-instance", () => {
    h && (h.isMinimized() && h.restore(), h.focus());
  }), m.on("activate", () => {
    V.getAllWindows().length === 0 && X();
  }), F.info("app ready", m.getVersion());
});
m.on("window-all-closed", () => {
  process.platform !== "darwin" && m.quit();
});
m.on("before-quit", () => {
  T.shutdown();
});
process.on("uncaughtException", (t) => F.error("uncaughtException", t));
process.on("unhandledRejection", (t) => F.error("unhandledRejection", t));
