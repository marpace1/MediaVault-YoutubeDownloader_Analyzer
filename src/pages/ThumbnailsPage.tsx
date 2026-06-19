import { useUiStore } from '@/store/useUiStore';
import { UrlInput } from '@/components/UrlInput';
import { ThumbnailPanel } from '@/components/video/ThumbnailPanel';
import { EmptyState, ASCII } from '@/components/EmptyState';

/** Thumbnail browser page. */
export function ThumbnailsPage() {
  const video = useUiStore((s) => s.currentVideo);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <h1 className="section-title">Thumbnails</h1>
      <p className="text-xs text-text-secondary">
        Browse and download every available thumbnail resolution.
      </p>

      <div className="divider" />
      <UrlInput autoFocus={false} />

      {video ? (
        <>
          <div className="card flex items-center gap-4">
            <div className="relative h-10 w-16 shrink-0 overflow-hidden bg-surface-2">
              {video.thumbnails.at(-1)?.url && (
                <img src={video.thumbnails.at(-1)!.url} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-text-primary">{video.title}</p>
            </div>
          </div>
          <ThumbnailPanel video={video} />
        </>
      ) : (
        <EmptyState
          ascii={ASCII.thumbnails}
          message="Analyze a video to browse its thumbnails."
        />
      )}
    </div>
  );
}