#!/usr/bin/env node
/**
 * Build preflight: verifies that the platform's yt-dlp (and, when available,
 * ffmpeg) binaries are present in resources/bin/<platform> BEFORE packaging.
 *
 * Why this exists: the binaries are gitignored (they are large and platform
 * specific), so a fresh clone or a `git clean` leaves resources/bin/<os> empty.
 * electron-builder would then silently ship an app with no bundled engines —
 * the cause of "FFmpeg disappeared from resources/bin/win after reruns" and
 * "ffmpeg reports missing on a clean machine".
 *
 * Behaviour:
 *   • yt-dlp MISSING  -> hard error (run `npm run fetch-binaries`).
 *   • ffmpeg MISSING  -> warning only (the app can fall back to a PATH install,
 *                         but a self-contained build should bundle it).
 *
 * Pass --strict to also fail when ffmpeg is missing.
 */
import { existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const platform =
  process.platform === 'win32' ? 'win' : process.platform === 'darwin' ? 'mac' : 'linux';
const exe = process.platform === 'win32' ? '.exe' : '';
const binDir = join(ROOT, 'resources', 'bin', platform);

const ytDlp = join(binDir, `yt-dlp${exe}`);
const ffmpeg = join(binDir, `ffmpeg${exe}`);
// ffprobe is required alongside ffmpeg: yt-dlp uses it for post-processing
// (e.g. --embed-thumbnail / --embed-metadata). Bundling ffmpeg WITHOUT ffprobe
// causes "ffprobe not found" errors even though the media downloads fine.
const ffprobe = join(binDir, `ffprobe${exe}`);

const strict = process.argv.includes('--strict');

function present(p) {
  try {
    return existsSync(p) && statSync(p).size > 0;
  } catch {
    return false;
  }
}

let failed = false;

if (present(ytDlp)) {
  console.log(`✓ yt-dlp bundled: ${ytDlp}`);
} else {
  console.error(`✗ yt-dlp MISSING at ${ytDlp}`);
  console.error('  Run:  npm run fetch-binaries');
  failed = true;
}

const ffmpegOk = present(ffmpeg);
const ffprobeOk = present(ffprobe);
if (ffmpegOk && ffprobeOk) {
  console.log(`✓ ffmpeg bundled:  ${ffmpeg}`);
  console.log(`✓ ffprobe bundled: ${ffprobe}`);
} else {
  const parts = [];
  if (!ffmpegOk) parts.push('ffmpeg');
  if (!ffprobeOk) parts.push('ffprobe');
  const msg = `${parts.join(' + ')} not bundled in ${binDir} (BOTH are required; see BUILD.md)`;
  if (strict) {
    console.error(`✗ ${msg}`);
    failed = true;
  } else {
    console.warn(`⚠ ${msg}`);
    console.warn('  The packaged app will rely on a PATH/custom ffmpeg+ffprobe at runtime.');
  }
}

if (failed) {
  console.error('\nBuild preflight failed: bundled engine binaries are missing.');
  process.exit(1);
}
console.log('Binary preflight OK.');
