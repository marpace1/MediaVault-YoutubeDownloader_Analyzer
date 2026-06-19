import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Maximize2, X } from 'lucide-react';
import type { VideoInfo, ThumbnailInfo, DownloadRequest } from '@shared/types';
import { useDownloadStore } from '@/store/useDownloadStore';
import { useUiStore } from '@/store/useUiStore';

/** Thumbnail grid — square, no shadow, no gradient. */
export function ThumbnailPanel({ video }: { video: VideoInfo }) {
  const start = useDownloadStore((s) => s.start);
  const toast = useUiStore((s) => s.toast);
  const [preview, setPreview] = useState<ThumbnailInfo | null>(null);

  const thumbs = [...video.thumbnails].reverse();

  const download = async (t: ThumbnailInfo) => {
    const req: DownloadRequest = {
      url: video.url,
      title: video.title,
      thumbnail: t.url,
      channel: video.channel,
      duration: video.duration,
      options: { kind: 'thumbnail', thumbnailUrl: t.url, thumbnailLabel: t.label },
    };
    try {
      await start(req);
      toast('Thumbnail download started', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  };

  if (thumbs.length === 0) {
    return <p className="text-xs text-text-secondary">No thumbnails available.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {thumbs.map((t, i) => (
          <div
            key={t.id}
            className="group border border-border bg-surface overflow-hidden animate-slide-up"
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <div className="relative aspect-video overflow-hidden bg-surface-2">
              <img
                src={t.url}
                alt={t.label}
                loading="lazy"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-bg/70 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                <button
                  onClick={() => setPreview(t)}
                  className="btn-ghost px-2 py-1 text-[10px]"
                  title="Enlarge"
                >
                  <Maximize2 className="h-3 w-3" />
                </button>
                <button
                  onClick={() => download(t)}
                  className="btn-primary px-2 py-1 text-[10px]"
                >
                  <Download className="h-3 w-3" /> Save
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between px-2.5 py-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-text-secondary">
                {t.label}
              </span>
              <span className="text-[10px] text-muted tabular-nums">
                {t.width && t.height ? `${t.width}x${t.height}` : 'Original'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox — monochrome */}
      {createPortal(
        preview && (
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-bg/90"
            onClick={() => setPreview(null)}
          >
            <div
              className="relative max-h-full max-w-4xl border border-border bg-surface"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={preview.url}
                alt={preview.label}
                className="max-h-[70vh] w-full object-contain"
              />
              <div className="flex items-center justify-between border-t border-border p-3">
                <div>
                  <p className="text-xs font-semibold text-text-primary">{preview.label}</p>
                  <p className="text-[10px] text-muted">
                    {preview.width && preview.height
                      ? `${preview.width}x${preview.height}`
                      : 'Original resolution'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => download(preview)} className="btn-primary text-[10px]">
                    <Download className="h-3 w-3" /> Download
                  </button>
                  <button onClick={() => setPreview(null)} className="btn-icon">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ),
        document.body,
      )}
    </>
  );
}