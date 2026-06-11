/**
 * Maps raw yt-dlp / ffmpeg / node error output into concise, user-friendly
 * messages. yt-dlp's stderr is verbose and noisy; we surface the actionable
 * essence so the UI can show something meaningful.
 */

interface Rule {
  test: RegExp;
  message: string;
}

const RULES: Rule[] = [
  { test: /age[- ]?restrict|confirm your age|inappropriate for some users|sign in to confirm your age/i, message: 'This video is age-restricted and cannot be downloaded without authentication.' },
  { test: /private video|this video is private/i, message: 'This video is private.' },
  { test: /video unavailable|has been removed|no longer available|account.*terminated/i, message: 'This video is unavailable or has been removed.' },
  { test: /not available in your country|geo|blocked it in your country/i, message: 'This video is geo-blocked in your region.' },
  { test: /members[- ]only|join this channel/i, message: 'This is a members-only video.' },
  { test: /premiere|will begin in|live event will begin/i, message: 'This is a scheduled premiere or upcoming live stream.' },
  { test: /copyright|claimed by/i, message: 'This video is blocked due to a copyright claim.' },
  // IMPORTANT: only match a GENUINE "ffmpeg not found" condition. A naive
  // /ffmpeg/ alternative matched ANY line mentioning ffmpeg (even success/info
  // lines), causing false "FFmpeg was not found" errors on working downloads.
  { test: /(ffmpeg|ffprobe)\b[^\n]*\b(not found|is not installed|could not be found)|cannot find ffmpeg|ffmpeg not found|please install ffmpeg|you have requested merging.*but ffmpeg|enoent[^\n]*ffmpeg/i, message: 'FFmpeg was not found. Set its path in Settings to enable merging and conversion.' },
  { test: /yt-dlp[^\n]*not found|enoent[^\n]*yt-dlp/i, message: 'yt-dlp was not found. Set its path in Settings.' },
  { test: /no space left|disk full|enospc/i, message: 'Download failed: the disk is full.' },
  { test: /permission denied|eacces|eperm/i, message: 'Permission denied. Choose a different download folder in Settings.' },
  { test: /unable to download|http error 4\d\d|http error 5\d\d/i, message: 'Network error while downloading. Please retry.' },
  { test: /unable to resolve host|getaddrinfo|network is unreachable|timed? out/i, message: 'No internet connection or the request timed out.' },
  { test: /requested format (is )?not available|requested format not available/i, message: 'The selected quality/format is not available for this video. Try "Best Available".' },
  { test: /unsupported url|is not a valid url/i, message: 'That URL is not supported.' },
];

export function humanizeError(raw: string | null | undefined): string {
  if (!raw) return 'An unknown error occurred.';
  // eslint-disable-next-line no-control-regex -- strips ANSI color escape codes
  const text = raw.replace(/\u001b\[[0-9;]*m/g, '').trim();
  for (const rule of RULES) {
    if (rule.test.test(text)) return rule.message;
  }
  // Fall back to the last meaningful "ERROR:" line yt-dlp printed.
  const errLine = text
    .split('\n')
    .reverse()
    .find((l) => /error/i.test(l));
  if (errLine) {
    return errLine.replace(/^.*?ERROR:\s*/i, '').slice(0, 240) || 'Download failed.';
  }
  return text.slice(0, 240) || 'Download failed.';
}
