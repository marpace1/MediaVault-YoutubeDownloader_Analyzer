/**
 * Detects whether yt-dlp and ffmpeg are available and reports their versions.
 * Surfaced in Settings so users can install/point to the binaries.
 *
 * Reliability design:
 *   • Detection is "sticky". Once an engine at a given resolved path is
 *     confirmed available, a later transient probe failure (e.g. the binary is
 *     momentarily busy spawning a download, or a slow Windows process launch)
 *     will NOT flip the UI back to "missing". We only downgrade when the
 *     resolved path actually changes (settings edit) or it was never confirmed.
 *   • This directly fixes "Home page sometimes reports yt-dlp/ffmpeg missing
 *     even though downloads work".
 */
import type { DependencyStatus } from '../../shared/types';
import { resolveBinary, probeVersion } from '../utils/binaries';
import { readSettings } from './settings';

interface CachedProbe {
  path: string;
  version: string;
}

// Last successful probe per engine, keyed by the resolved path.
const lastGood: { ytDlp: CachedProbe | null; ffmpeg: CachedProbe | null } = {
  ytDlp: null,
  ffmpeg: null,
};

export async function checkDependencies(): Promise<DependencyStatus> {
  const s = readSettings();

  const ytDlpPath = resolveBinary('yt-dlp', s.ytDlpPath);
  const ffmpegPath = resolveBinary('ffmpeg', s.ffmpegPath);
  // ffprobe is derived from the same source as ffmpeg (sibling / bundled / PATH).
  const ffprobePath = resolveBinary('ffprobe', s.ffmpegPath);

  const [ytVerRaw, ffVerRaw, ffprobeRaw] = await Promise.all([
    probeVersion(ytDlpPath, ['--version']),
    probeVersion(ffmpegPath, ['-version']),
    probeVersion(ffprobePath, ['-version']),
  ]);

  // ffmpeg -version prints "ffmpeg version x.y ..." — keep the version token.
  const ffVer = ffVerRaw
    ? ffVerRaw.replace(/^ffmpeg version\s*/i, '').split(' ')[0] ?? ffVerRaw
    : null;

  const ytDlp = resolveSticky('ytDlp', ytDlpPath, ytVerRaw);
  // FFmpeg is only truly usable for downloads when ffprobe is ALSO present —
  // yt-dlp post-processing (merge metadata / thumbnails) needs ffprobe. We gate
  // availability on both so the UI status matches real download behaviour.
  const ffmpeg = resolveSticky('ffmpeg', ffmpegPath, ffVer && ffprobeRaw ? ffVer : null);

  return { ytDlp, ffmpeg };
}

/**
 * Combine a fresh probe with the cached last-known-good result for stability.
 */
function resolveSticky(
  key: 'ytDlp' | 'ffmpeg',
  path: string,
  freshVersion: string | null,
): DependencyStatus['ytDlp'] {
  if (freshVersion) {
    // Fresh success — update the cache and report available.
    lastGood[key] = { path, version: freshVersion };
    return { available: true, version: freshVersion, path };
  }

  // Fresh failure: if we previously confirmed THIS SAME path, trust the cache
  // (transient hiccup) rather than scaring the user with a false "missing".
  const cached = lastGood[key];
  if (cached && cached.path === path) {
    return { available: true, version: cached.version, path };
  }

  // Genuinely not available (never confirmed, or path changed).
  return { available: false, version: null, path };
}
