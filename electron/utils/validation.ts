/**
 * URL validation + sanitisation helpers. These run in the main process before
 * any value reaches a child process, mitigating command-injection style abuse.
 */

const YT_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'www.youtu.be',
]);

export interface UrlClassification {
  valid: boolean;
  isPlaylist: boolean;
  normalized: string | null;
  reason?: string;
}

/**
 * Validate a YouTube URL and tell the caller whether it points to a playlist.
 * We are deliberately strict: only http(s) + known YouTube hosts are allowed.
 */
export function classifyYouTubeUrl(raw: string): UrlClassification {
  const trimmed = raw.trim();
  if (!trimmed) return { valid: false, isPlaylist: false, normalized: null, reason: 'Empty URL' };

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, isPlaylist: false, normalized: null, reason: 'Malformed URL' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, isPlaylist: false, normalized: null, reason: 'Unsupported protocol' };
  }

  if (!YT_HOSTS.has(parsed.hostname)) {
    return { valid: false, isPlaylist: false, normalized: null, reason: 'Not a YouTube URL' };
  }

  const hasList = parsed.searchParams.has('list');
  const isPlaylistPath = parsed.pathname.startsWith('/playlist');
  const isPlaylist = isPlaylistPath || (hasList && !parsed.searchParams.has('v') && !parsed.pathname.startsWith('/watch'));

  // Force https + canonical host so downstream tooling behaves predictably.
  parsed.protocol = 'https:';
  return {
    valid: true,
    isPlaylist: isPlaylistPath ? true : isPlaylist,
    normalized: parsed.toString(),
  };
}

/** Extract the first YouTube URL found in arbitrary text (clipboard/drag). */
export function extractYouTubeUrl(text: string): string | null {
  const match = text.match(
    /https?:\/\/(?:www\.|m\.|music\.)?(?:youtube\.com|youtu\.be)\/[^\s'"<>]+/i,
  );
  if (!match) return null;
  const cls = classifyYouTubeUrl(match[0]);
  return cls.valid ? cls.normalized : null;
}

/**
 * Make a string safe to use as a filename across Windows/macOS/Linux.
 * Removes reserved characters and trims length.
 */
export function sanitizeFilename(name: string): string {
  return name
    // eslint-disable-next-line no-control-regex -- intentionally strips control chars
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
    .replace(/\s+/g, ' ')
    .replace(/^\.+/, '')
    .trim()
    .slice(0, 180) || 'mediavault_download';
}
