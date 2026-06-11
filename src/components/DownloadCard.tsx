import { forwardRef, memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Pause,
  Play,
  X,
  RotateCcw,
  FolderOpen,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
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

const STATUS_META: Record<
  DownloadItem['status'],
  { label: string; className: string }
> = {
  queued: { label: 'Queued', className: 'text-muted' },
  downloading: { label: 'Downloading', className: 'text-brand-400' },
  processing: { label: 'Processing', className: 'text-amber-400' },
  paused: { label: 'Paused', className: 'text-amber-400' },
  completed: { label: 'Completed', className: 'text-emerald-400' },
  failed: { label: 'Failed', className: 'text-rose-400' },
  canceled: { label: 'Canceled', className: 'text-muted' },
};

const DownloadCardImpl = forwardRef<HTMLDivElement, { item: DownloadItem }>(
  function DownloadCardImpl({ item }, ref) {
  const { pause, resume, cancel, retry, remove } = useDownloadStore();
  const toast = useUiStore((s) => s.toast);
  const KindIcon = KIND_ICON[item.kind];
  const meta = STATUS_META[item.status];

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

  // Right-click context menu actions, derived from the item's current status.
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
      label: 'Copy source URL',
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
      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        whileHover={{ scale: 1.005 }}
        className="glass flex gap-4 rounded-2xl p-3.5"
      >
        {/* Thumbnail */}
        <div className="relative h-[68px] w-[120px] shrink-0 overflow-hidden rounded-xl bg-black/30">
          {item.thumbnail ? (
            <img src={item.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <KindIcon className="h-6 w-6 text-muted" />
            </div>
          )}
          <span className="absolute bottom-1 left-1 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium">
            <KindIcon className="h-3 w-3" />
            {item.kind}
          </span>
        </div>

        {/* Body */}
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{item.title}</p>
              <p className="truncate text-xs text-muted">
                {item.channel ?? 'Unknown'} · {item.formatLabel}
              </p>
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              {item.status === 'downloading' && <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-400" />}
              {isDone && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
              {isFailed && <AlertCircle className="h-3.5 w-3.5 text-rose-400" />}
              <span className={cn('text-xs font-medium', meta.className)}>{meta.label}</span>
            </div>
          </div>

          {/* Progress / meta row */}
          <div className="mt-2">
            {(isActive || isPaused) && (
              <ProgressBar
                percent={item.progress.percent}
                indeterminate={item.status === 'queued' || item.status === 'processing'}
                color={isPaused ? 'amber' : 'brand'}
              />
            )}
            {isDone && <ProgressBar percent={100} color="emerald" />}
            {isFailed && item.error && (
              <p className="truncate text-xs text-rose-400/80" title={item.error}>
                {item.error}
              </p>
            )}

            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-3 text-[11px] text-muted">
                {isActive && item.status === 'downloading' && (
                  <>
                    <span>{item.progress.percent.toFixed(1)}%</span>
                    {item.progress.speed && <span>↓ {item.progress.speed}</span>}
                    {item.progress.eta && <span>ETA {item.progress.eta}</span>}
                  </>
                )}
                {isDone && <span>{formatBytes(item.fileSize)}</span>}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5">
                {item.status === 'downloading' || item.status === 'processing' ? (
                  <button onClick={() => pause(item.id)} className="btn-icon h-7 w-7" title="Pause">
                    <Pause className="h-3.5 w-3.5" />
                  </button>
                ) : isPaused ? (
                  <button onClick={() => resume(item.id)} className="btn-icon h-7 w-7" title="Resume">
                    <Play className="h-3.5 w-3.5" />
                  </button>
                ) : null}

                {(isActive || isPaused) && (
                  <button onClick={() => cancel(item.id)} className="btn-icon h-7 w-7" title="Cancel">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}

                {isFailed && (
                  <button onClick={() => retry(item.id)} className="btn-icon h-7 w-7" title="Retry">
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                )}

                {isDone && item.filePath && (
                  <button onClick={openLocation} className="btn-icon h-7 w-7" title="Open location">
                    <FolderOpen className="h-3.5 w-3.5" />
                  </button>
                )}

                {(isDone || isFailed) && (
                  <button
                    onClick={() => remove(item.id)}
                    className="btn-icon h-7 w-7 hover:text-rose-400"
                    title="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </ContextMenu>
  );
});

/**
 * Memoized so cards only re-render when their own item reference changes —
 * essential when dozens of downloads stream progress updates concurrently.
 */
export const DownloadCard = memo(DownloadCardImpl, (prev, next) => prev.item === next.item);
