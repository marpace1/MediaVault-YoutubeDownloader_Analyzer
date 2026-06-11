import { useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, Maximize2, X } from 'lucide-react';
import type { VideoInfo, ThumbnailInfo, DownloadRequest } from '@shared/types';
import { useDownloadStore } from '@/store/useDownloadStore';
import { useUiStore } from '@/store/useUiStore';

/** Grid of every available thumbnail resolution with preview + one-click download. */
export function ThumbnailPanel({ video }: { video: VideoInfo }) {
  const start = useDownloadStore((s) => s.start);
  const toast = useUiStore((s) => s.toast);
  const [preview, setPreview] = useState<ThumbnailInfo | null>(null);

  // Highest resolution first.
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
    return <p className="text-sm text-muted">No thumbnails available.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {thumbs.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
            className="glass group overflow-hidden rounded-xl"
          >
            <div className="relative aspect-video overflow-hidden bg-black/30">
              <img
                src={t.url}
                alt={t.label}
                loading="lazy"
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/55 opacity-0 transition-opacity group-hover:opacity-100">
                <button onClick={() => setPreview(t)} className="btn-ghost px-2.5 py-1.5 text-xs" title="Enlarge">
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => download(t)} className="btn-primary px-3 py-1.5 text-xs">
                  <Download className="h-3.5 w-3.5" /> Download
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between p-2.5">
              <span className="text-xs font-medium">{t.label}</span>
              <span className="text-[11px] text-muted">
                {t.width && t.height ? `${t.width}×${t.height}` : 'Original'}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      {createPortal(
        <AnimatePresence>
          {preview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreview(null)}
              className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-8 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="glass-elevated relative max-h-full max-w-4xl overflow-hidden rounded-2xl"
              >
                <img src={preview.url} alt={preview.label} className="max-h-[70vh] w-full object-contain" />
                <div className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-semibold">{preview.label}</p>
                    <p className="text-xs text-muted">
                      {preview.width && preview.height ? `${preview.width}×${preview.height}` : 'Original resolution'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => download(preview)} className="btn-primary">
                      <Download className="h-4 w-4" /> Download
                    </button>
                    <button onClick={() => setPreview(null)} className="btn-icon">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
