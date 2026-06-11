import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ListVideo,
  CheckSquare,
  Square,
  Download,
  Music,
  Film,
  CheckCheck,
  XSquare,
  Loader2,
} from 'lucide-react';
import { useUiStore } from '@/store/useUiStore';
import { useDownloadStore } from '@/store/useDownloadStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { UrlInput } from '@/components/UrlInput';
import { EmptyState } from '@/components/EmptyState';
import { Select } from '@/components/Select';
import { Skeleton } from '@/components/Skeleton';
import { VIDEO_QUALITIES, AUDIO_FORMATS } from '@/lib/options';
import { formatDuration } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { VideoQuality, AudioFormat, DownloadRequest, PlaylistEntry } from '@shared/types';

/** Playlist viewer with multi-select + bulk video/audio download. */
export function PlaylistsPage() {
  const playlist = useUiStore((s) => s.currentPlaylist);
  const analyzing = useUiStore((s) => s.analyzing);
  const toast = useUiStore((s) => s.toast);
  const navigate = useUiStore((s) => s.navigate);
  const start = useDownloadStore((s) => s.start);
  const settings = useSettingsStore((s) => s.settings);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<'video' | 'audio'>('video');
  const [quality, setQuality] = useState<VideoQuality>(settings?.defaultVideoQuality ?? '1080');
  const [audioFormat, setAudioFormat] = useState<AudioFormat>(settings?.defaultAudioFormat ?? 'mp3');
  const [queuing, setQueuing] = useState(false);

  const entries = useMemo(() => playlist?.entries ?? [], [playlist]);
  const allSelected = entries.length > 0 && selected.size === entries.length;
  const someSelected = selected.size > 0;

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectAll = () => setSelected(new Set(entries.map((e) => e.id)));
  const deselectAll = () => setSelected(new Set());

  /** Enqueue an explicit list of entries with the current mode/format. */
  const queue = async (items: PlaylistEntry[]) => {
    if (items.length === 0 || queuing) return;
    setQueuing(true);
    try {
      for (const e of items) {
        const req: DownloadRequest = {
          url: e.url,
          title: e.title,
          thumbnail: e.thumbnail,
          channel: e.uploader,
          duration: e.duration,
          options:
            mode === 'video'
              ? { kind: 'video', quality, container: settings?.defaultVideoContainer ?? 'mp4' }
              : { kind: 'audio', format: audioFormat, bitrate: settings?.defaultAudioBitrate ?? '320' },
        };
        // Sequential enqueue keeps the queue ordered; the manager handles concurrency.
        // eslint-disable-next-line no-await-in-loop
        await start(req);
      }
      toast(`Queued ${items.length} ${mode === 'video' ? 'videos' : 'audio tracks'}`, 'success');
      navigate('downloads');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to queue downloads', 'error');
    } finally {
      setQueuing(false);
    }
  };

  const downloadSelected = () => queue(entries.filter((e) => selected.has(e.id)));
  const downloadAll = () => queue(entries);

  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Playlists</h1>
        <p className="mt-1 text-sm text-muted">Bulk-download entire playlists or hand-picked videos.</p>
      </div>

      <UrlInput autoFocus={false} />

      {analyzing && !playlist ? (
        <PlaylistSkeleton />
      ) : !playlist ? (
        <EmptyState icon={ListVideo} message="Paste a playlist URL to load its videos." />
      ) : (
        <>
          {/* Playlist header */}
          <div className="glass space-y-4 rounded-2xl p-4">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-36 shrink-0 overflow-hidden rounded-xl bg-black/30">
                {playlist.thumbnail ? (
                  <img src={playlist.thumbnail} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ListVideo className="h-7 w-7 text-muted" />
                  </div>
                )}
                <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-semibold">
                  {playlist.entryCount} videos
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-semibold">{playlist.title}</p>
                <p className="truncate text-sm text-muted">{playlist.uploader ?? 'Unknown channel'}</p>
                <p className="mt-1 text-xs text-muted">
                  {someSelected ? `${selected.size} of ${entries.length} selected` : `${entries.length} videos`}
                </p>
              </div>
            </div>

            {/* Selection controls */}
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={selectAll} disabled={allSelected} className="btn-ghost text-xs">
                <CheckCheck className="h-3.5 w-3.5" /> Select all
              </button>
              <button onClick={deselectAll} disabled={!someSelected} className="btn-ghost text-xs">
                <XSquare className="h-3.5 w-3.5" /> Deselect all
              </button>
            </div>

            {/* Format controls + download actions */}
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex gap-1 rounded-xl border border-white/10 bg-black/20 p-1">
                <button
                  onClick={() => setMode('video')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition',
                    mode === 'video' ? 'bg-brand-500/30 text-white ring-1 ring-brand-400/40' : 'text-muted',
                  )}
                >
                  <Film className="h-3.5 w-3.5" /> Video
                </button>
                <button
                  onClick={() => setMode('audio')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition',
                    mode === 'audio' ? 'bg-brand-500/30 text-white ring-1 ring-brand-400/40' : 'text-muted',
                  )}
                >
                  <Music className="h-3.5 w-3.5" /> Audio
                </button>
              </div>

              {mode === 'video' ? (
                <Select value={quality} options={VIDEO_QUALITIES} onChange={setQuality} className="w-40" />
              ) : (
                <Select value={audioFormat} options={AUDIO_FORMATS} onChange={setAudioFormat} className="w-40" />
              )}

              <div className="ml-auto flex gap-2">
                <button
                  onClick={downloadSelected}
                  disabled={!someSelected || queuing}
                  className="btn-ghost"
                >
                  <Download className="h-4 w-4" />
                  Download Selected{someSelected ? ` (${selected.size})` : ''}
                </button>
                <button onClick={downloadAll} disabled={queuing} className="btn-primary">
                  {queuing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Download Entire Playlist
                </button>
              </div>
            </div>
          </div>

          {/* Entries */}
          <div className="min-h-0 flex-1 space-y-2 overflow-auto pr-1">
            {entries.map((e, i) => {
              const isSel = selected.has(e.id);
              return (
                <motion.button
                  key={e.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.015, 0.3) }}
                  onClick={() => toggle(e.id)}
                  className={cn(
                    'glass flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition',
                    isSel && 'ring-1 ring-brand-400/50',
                  )}
                >
                  {isSel ? (
                    <CheckSquare className="h-5 w-5 shrink-0 text-brand-400" />
                  ) : (
                    <Square className="h-5 w-5 shrink-0 text-muted" />
                  )}
                  <span className="w-6 shrink-0 text-center text-xs tabular-nums text-muted">{i + 1}</span>
                  <div className="relative h-11 w-20 shrink-0 overflow-hidden rounded-lg bg-black/30">
                    {e.thumbnail && <img src={e.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{e.title}</p>
                    <p className="text-xs text-muted">
                      {e.uploader ?? ''} {e.duration ? `· ${formatDuration(e.duration)}` : ''}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/** Loading skeleton shown while a playlist is being analyzed. */
function PlaylistSkeleton() {
  return (
    <div className="space-y-5">
      <div className="glass flex items-center gap-4 rounded-2xl p-4">
        <Skeleton className="h-20 w-36 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
