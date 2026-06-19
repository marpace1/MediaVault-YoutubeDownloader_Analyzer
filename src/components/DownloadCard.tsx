import { forwardRef, memo, useMemo } from 'react';
import {
  Pause,
  Play,
  X,
  RotateCcw,
  FolderOpen,
  Trash2,
  Film,
  Music,
  Image as ImageIcon,
  Captions,
  FileVideo,
  Copy,
} from 'lucide-react';
import type { DownloadItem, DownloadKind } from '@shared/types';
import { ProgressBar } from './ProgressBar';
import { ContextMenu, type MenuItem } from './ContextMenu';
import { useDownloadStore } from '@/store/useDownloadStore';
import { useUiStore } from '@/store/useUiStore';
import { formatBytes } from '@/lib/format';
import { cn } from '@/lib/cn';

const KIND_ICON: Record<DownloadKind, typeof Film> = {
  video: Film,
  audio: Music,
  thumbnail: ImageIcon,
  subtitle: Captions,
};

type StatusKey = DownloadItem['status'];

const STATUS_LABEL: Record<StatusKey, string> = {
  queued: 'Queued',
  downloading: 'Downloading',
  processing: 'Processing',
  paused: 'Paused',
  completed: 'Completed',
  failed: 'Failed',
  canceled: 'Canceled',
};

/**
 * Compact row layout for download queue.
 * Thumbnail | Title | Progress | Speed | ETA | Status | Actions
 */
const DownloadCardImpl = forwardRef<HTMLDivElement, { item: DownloadItem }>(
  function DownloadCardImpl({ item }, ref) {
    const { pause, resume, cancel, retry, remove } = useDownloadStore();
    const toast = useUiStore((s) => s.toast);
    const KindIcon = KIND_ICON[item.kind];

    const isActive = ['downloading', 'processing', 'queued'].includes(item.status);
    const isPaused = item.status === 'paused';
    const isDone = item.status === 'completed';
    const isFailed = item.status === 'failed' || item.status === 'canceled';

    const openLocation = async () => {
      if (!item.filePath) return;
      try {
        await window.mediavault.openLocation(item.filePath);
      } catch {
        toast('Could not open file location', 'error');
      }
    };

    const openFile = async () => {
      if (!item.filePath) return;
      try {
        await window.mediavault.openFile(item.filePath);
      } catch {
        toast('Could not open file', 'error');
      }
    };

    const menuItems = useMemo<MenuItem[]>(() => {
      const items: MenuItem[] = [];
      if (item.status === 'downloading' || item.status === 'processing')
        items.push({ label: 'Pause', icon: Pause, onClick: () => pause(item.id) });
      if (isPaused) items.push({ label: 'Resume', icon: Play, onClick: () => resume(item.id) });
      if (isActive || isPaused)
        items.push({ label: 'Cancel', icon: X, onClick: () => cancel(item.id) });
      if (isFailed) items.push({ label: 'Retry', icon: RotateCcw, onClick: () => retry(item.id) });
      if (isDone && item.filePath) {
        items.push({ label: 'Open file', icon: FileVideo, onClick: openFile });
        items.push({ label: 'Show in folder', icon: FolderOpen, onClick: openLocation });
      }
      items.push({
        label: 'Copy URL',
        icon: Copy,
        onClick: () => {
          navigator.clipboard.writeText(item.url).catch(() => undefined);
          toast('URL copied', 'success');
        },
      });
      if (isDone || isFailed)
        items.push({ label: 'Remove', icon: Trash2, danger: true, onClick: () => remove(item.id) });
      return items;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item.status, item.filePath, item.id]);

    return (
      <ContextMenu ref={ref} items={menuItems}>
        <div
          className={cn(
            'group flex items-center gap-3 border-b border-border px-2 py-2 transition-colors duration-100',
            'hover:bg-hover',
          )}
        >
          {/* Thumbnail */}
          <div className="relative h-9 w-16 shrink-0 overflow-hidden bg-surface-2">
            {item.thumbnail ? (
              <img
                src={item.thumbnail}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <KindIcon className="h-3.5 w-3.5 text-muted" />
              </div>
            )}
          </div>

          {/* Title + Kind */}
          <div className="min-w-0 w-[30%]">
            <p className="truncate text-xs font-medium text-text-primary" title={item.title}>
              {item.title}
            </p>
            <p className="truncate text-[10px] text-muted">
              {item.channel ?? '—'} · {item.kind.toUpperCase()}
            </p>
          </div>

          {/* Progress bar + percent */}
          <div className="min-w-0 w-[25%]">
            {(isActive || isPaused) && (
              <ProgressBar
                percent={item.progress.percent}
                indeterminate={item.status === 'queued' || item.status === 'processing'}
                className="mb-1"
              />
            )}
            {isDone && <ProgressBar percent={100} className="mb-1" />}
            <p className="text-[10px] text-muted tabular-nums">
              {isActive && item.status === 'downloading' && (
                <>
                  {item.progress.percent.toFixed(1)}%
                  {item.progress.speed && ` · ${item.progress.speed}`}
                </>
              )}
              {isDone && formatBytes(item.fileSize)}
              {isFailed && item.error && (
                <span className="truncate text-text-secondary" title={item.error}>
                  {item.error}
                </span>
              )}
              {isPaused && 'Paused'}
              {item.status === 'queued' && 'Queued…'}
              {item.status === 'processing' && 'Processing…'}
            </p>
          </div>

          {/* ETA */}
          <div className="w-16 shrink-0 text-right text-[10px] text-muted tabular-nums">
            {isActive && item.status === 'downloading' && item.progress.eta
              ? `ETA ${item.progress.eta}`
              : ''}
          </div>

          {/* Status */}
          <div className="w-20 shrink-0 text-right text-[10px] uppercase tracking-wider">
            <span
              className={cn(
                isDone && 'text-text-primary',
                isFailed && 'text-text-secondary',
                !isDone && !isFailed && 'text-muted',
              )}
            >
              {STATUS_LABEL[item.status]}
            </span>
          </div>

          {/* Actions */}
          <div className="flex w-16 shrink-0 items-center justify-end gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            {item.status === 'downloading' || item.status === 'processing' ? (
              <button onClick={() => pause(item.id)} className="btn-icon h-6 w-6" title="Pause" aria-label="Pause">
                <Pause className="h-3 w-3" />
              </button>
            ) : isPaused ? (
              <button onClick={() => resume(item.id)} className="btn-icon h-6 w-6" title="Resume" aria-label="Resume">
                <Play className="h-3 w-3" />
              </button>
            ) : null}

            {(isActive || isPaused) && (
              <button onClick={() => cancel(item.id)} className="btn-icon h-6 w-6" title="Cancel" aria-label="Cancel">
                <X className="h-3 w-3" />
              </button>
            )}

            {isFailed && (
              <button onClick={() => retry(item.id)} className="btn-icon h-6 w-6" title="Retry" aria-label="Retry">
                <RotateCcw className="h-3 w-3" />
              </button>
            )}

            {isDone && item.filePath && (
              <button onClick={openLocation} className="btn-icon h-6 w-6" title="Open location" aria-label="Open location">
                <FolderOpen className="h-3 w-3" />
              </button>
            )}

            {(isDone || isFailed) && (
              <button
                onClick={() => remove(item.id)}
                className="btn-icon h-6 w-6"
                title="Remove"
                aria-label="Remove"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </ContextMenu>
    );
  },
);

export const DownloadCard = memo(DownloadCardImpl, (prev, next) => prev.item === next.item);