import { useState, useMemo } from 'react';
import {
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
import { EmptyState, ASCII } from '@/components/EmptyState';
import { Select } from '@/components/Select';
import { Skeleton } from '@/components/Skeleton';
import { VIDEO_QUALITIES, AUDIO_FORMATS } from '@/lib/options';
import { formatDuration } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { VideoQuality, AudioFormat, DownloadRequest, PlaylistEntry } from '@shared/types';

/** Playlist viewer with multi-select + bulk download. Tree/table layout. */
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
  const [search, setSearch] = useState('');

  const entries = useMemo(() => {
    const all = playlist?.entries ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter((e) => e.title.toLowerCase().includes(q));
  }, [playlist, search]);

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
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col space-y-4">
      <h1 className="section-title">Playlists</h1>
      <p className="text-xs text-text-secondary">
        Bulk-download entire playlists or hand-pick videos.
      </p>

      <div className="divider" />
      <UrlInput autoFocus={false} />

      {analyzing && !playlist ? (
        <PlaylistSkeleton />
      ) : !playlist ? (
        <EmptyState
          ascii={ASCII.playlist}
          message="Paste a playlist URL to load its videos."
        />
      ) : (
        <>
          {/* Playlist header */}
          <div className="card space-y-3">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-28 shrink-0 overflow-hidden bg-surface-2">
                {playlist.thumbnail ? (
                  <img src={playlist.thumbnail} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted text-xs">NO IMG</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-text-primary">{playlist.title}</p>
                <p className="truncate text-xs text-text-secondary">{playlist.uploader ?? 'Unknown channel'}</p>
                <p className="mt-1 text-[10px] text-muted">
                  {someSelected
                    ? `${selected.size} of ${entries.length} selected`
                    : `${entries.length} videos`}
                </p>
              </div>
            </div>

            {/* Controls row */}
            <div className="flex flex-wrap items-end gap-3">
              {/* Mode toggle */}
              <div className="flex border border-border">
                <button
                  onClick={() => setMode('video')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest transition-colors duration-150',
                    mode === 'video'
                      ? 'bg-selection text-text-primary'
                      : 'text-muted hover:text-text-secondary',
                  )}
                >
                  <Film className="h-3 w-3" /> Video
                </button>
                <button
                  onClick={() => setMode('audio')}
                  className={cn(
                    'flex items-center gap-1.5 border-l border-border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest transition-colors duration-150',
                    mode === 'audio'
                      ? 'bg-selection text-text-primary'
                      : 'text-muted hover:text-text-secondary',
                  )}
                >
                  <Music className="h-3 w-3" /> Audio
                </button>
              </div>

              {mode === 'video' ? (
                <Select value={quality} options={VIDEO_QUALITIES} onChange={setQuality} className="w-40" />
              ) : (
                <Select value={audioFormat} options={AUDIO_FORMATS} onChange={setAudioFormat} className="w-40" />
              )}

              <div className="ml-auto flex gap-2">
                <button onClick={downloadSelected} disabled={!someSelected || queuing} className="btn-ghost text-[10px]">
                  <Download className="h-3 w-3" />
                  Selected ({selected.size})
                </button>
                <button onClick={downloadAll} disabled={queuing} className="btn-primary text-[10px]">
                  {queuing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                  Download All
                </button>
              </div>
            </div>
          </div>

          {/* Selection + search */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button onClick={selectAll} disabled={allSelected} className="btn-ghost px-2 py-1 text-[10px]">
                <CheckCheck className="h-3 w-3" /> Select All
              </button>
              <button onClick={deselectAll} disabled={!someSelected} className="btn-ghost px-2 py-1 text-[10px]">
                <XSquare className="h-3 w-3" /> Deselect
              </button>
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter…"
              className="input-bordered w-48 text-[11px]"
              aria-label="Filter playlist entries"
            />
          </div>

          {/* Entry list — tree/table */}
          <div className="min-h-0 flex-1 overflow-y-auto border border-border">
            {entries.map((e, i) => {
              const isSel = selected.has(e.id);
              return (
                <button
                  key={e.id}
                  onClick={() => toggle(e.id)}
                  className={cn(
                    'flex w-full items-center gap-3 border-b border-border px-3 py-2 text-left transition-colors duration-100 last:border-b-0',
                    isSel ? 'bg-selection' : 'hover:bg-hover',
                  )}
                >
                  {isSel ? (
                    <CheckSquare className="h-4 w-4 shrink-0 text-text-primary" />
                  ) : (
                    <Square className="h-4 w-4 shrink-0 text-muted" />
                  )}
                  <span className="w-6 shrink-0 text-right text-[10px] tabular-nums text-muted">
                    {i + 1}
                  </span>
                  <div className="relative h-8 w-14 shrink-0 overflow-hidden bg-surface-2">
                    {e.thumbnail && (
                      <img src={e.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-text-primary">{e.title}</p>
                    <p className="text-[10px] text-muted">
                      {e.uploader ?? ''}
                      {e.duration ? ` · ${formatDuration(e.duration)}` : ''}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function PlaylistSkeleton() {
  return (
    <div className="space-y-4">
      <div className="card flex items-center gap-4">
        <Skeleton className="h-16 w-28" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <div className="space-y-px">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}