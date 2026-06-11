#!/usr/bin/env node
/**
 * Downloads the yt-dlp + ffmpeg binaries into resources/bin/<platform> so they
 * can be bundled by electron-builder (extraResources). Run this once before a
 * production build, or rely on the user's system binaries in development.
 *
 *   node scripts/fetch-binaries.mjs            # current platform
 *   node scripts/fetch-binaries.mjs --all      # all platforms (yt-dlp only)
 *
 * NOTE: FFmpeg is large and platform-specific. For full offline builds, place
 * an `ffmpeg` (or `ffmpeg.exe`) binary into the matching resources/bin folder
 * manually, or install ffmpeg-static and copy from there. yt-dlp is fetched
 * automatically from its official GitHub releases.
 */
import { createWriteStream } from 'node:fs';
import { mkdir, chmod } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';
import https from 'node:https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const YT_BASE = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download';

const TARGETS = {
  win: { ytdlp: 'yt-dlp.exe', out: 'win' },
  mac: { ytdlp: 'yt-dlp_macos', out: 'mac', rename: 'yt-dlp' },
  linux: { ytdlp: 'yt-dlp', out: 'linux' },
};

function currentPlatform() {
  if (process.platform === 'win32') return 'win';
  if (process.platform === 'darwin') return 'mac';
  return 'linux';
}

/** Follow redirects and stream a URL to a file. */
function download(url, dest) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'mediavault-build' } }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          download(res.headers.location, dest).then(resolve, reject);
          res.resume();
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          res.resume();
          return;
        }
        pipeline(res, createWriteStream(dest)).then(resolve, reject);
      })
      .on('error', reject);
  });
}

async function fetchYtDlp(key) {
  const t = TARGETS[key];
  const dir = join(ROOT, 'resources', 'bin', t.out);
  await mkdir(dir, { recursive: true });
  const dest = join(dir, t.rename ?? t.ytdlp);
  console.log(`↓ yt-dlp (${key}) -> ${dest}`);
  await download(`${YT_BASE}/${t.ytdlp}`, dest);
  if (key !== 'win') await chmod(dest, 0o755);
  console.log(`✓ yt-dlp (${key}) ready`);
}

const all = process.argv.includes('--all');
const keys = all ? Object.keys(TARGETS) : [currentPlatform()];

for (const key of keys) {
  try {
    await fetchYtDlp(key);
  } catch (err) {
    console.error(`✗ Failed to fetch yt-dlp for ${key}:`, err.message);
    process.exitCode = 1;
  }
}

console.log('\nReminder: place an ffmpeg binary in resources/bin/<platform>/ for');
console.log('fully self-contained builds (see BUILD.md).');
