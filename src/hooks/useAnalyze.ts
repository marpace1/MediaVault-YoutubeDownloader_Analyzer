/**
 * Hook that encapsulates analyzing a pasted URL: validates, calls the bridge,
 * stores the result, and routes the user to the right page (video vs playlist).
 *
 * Playlist detection rules (mirrors the main-process classifier):
 *   • /playlist?list=...                -> always a playlist
 *   • /watch?v=...&list=...             -> a video that is PART OF a playlist.
 *                                          We treat it as a playlist so the user
 *                                          can bulk-download, EXCEPT auto-generated
 *                                          mixes/radios (list=RD*) which aren't
 *                                          real playlists.
 *   • bare /watch?v=...                 -> a single video
 */
import { useCallback } from 'react';
import { useUiStore } from '@/store/useUiStore';

/** Decide whether a URL should be analysed as a playlist. */
export function shouldAnalyzeAsPlaylist(rawUrl: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return false;
  }
  if (parsed.pathname.startsWith('/playlist')) return true;

  const list = parsed.searchParams.get('list');
  if (!list) return false;

  // Auto-generated mixes / radios are not downloadable playlists.
  if (/^(RD|UL|LL|WL)/i.test(list)) return false;

  return true;
}

export function useAnalyze() {
  const setAnalyzing = useUiStore((s) => s.setAnalyzing);
  const setVideo = useUiStore((s) => s.setVideo);
  const setPlaylist = useUiStore((s) => s.setPlaylist);
  const navigate = useUiStore((s) => s.navigate);
  const toast = useUiStore((s) => s.toast);

  const analyze = useCallback(
    async (rawUrl: string) => {
      const url = rawUrl.trim();
      if (!url) return;
      setAnalyzing(true);
      setVideo(null);
      setPlaylist(null);

      try {
        if (shouldAnalyzeAsPlaylist(url)) {
          navigate('playlists');
          const playlist = await window.mediavault.analyzePlaylist(url);
          setPlaylist(playlist);
          toast(`Loaded playlist: ${playlist.entryCount} videos`, 'success');
        } else {
          navigate('video');
          const video = await window.mediavault.analyzeUrl(url);
          setVideo(video);
          toast('Video analyzed', 'success');
        }
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Failed to analyze URL', 'error');
        navigate('home');
      } finally {
        setAnalyzing(false);
      }
    },
    [setAnalyzing, setVideo, setPlaylist, navigate, toast],
  );

  return analyze;
}
