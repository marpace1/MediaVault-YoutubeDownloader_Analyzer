import { useUiStore } from '@/store/useUiStore';
import { UrlInput } from '@/components/UrlInput';
import { AnalyticsPanel } from '@/components/video/AnalyticsPanel';
import { EmptyState, ASCII } from '@/components/EmptyState';

/** Analytics page with URL input + deep metadata view. */
export function AnalyticsPage() {
  const video = useUiStore((s) => s.currentVideo);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <h1 className="section-title">Analyzer</h1>
      <p className="text-xs text-text-secondary">
        Deep metadata insights for any video.
      </p>

      <div className="divider" />
      <UrlInput autoFocus={false} />

      {video ? (
        <>
          <div className="card flex items-center gap-4">
            {video.thumbnails.at(-1)?.url && (
              <img
                src={video.thumbnails.at(-1)!.url}
                alt=""
                className="h-12 w-20 shrink-0 object-cover bg-surface-2"
              />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text-primary">{video.title}</p>
              <p className="truncate text-xs text-text-secondary">{video.channel}</p>
            </div>
          </div>
          <AnalyticsPanel video={video} />
        </>
      ) : (
        <EmptyState
          ascii={ASCII.analytics}
          message="Analyze a video to view detailed analytics."
        />
      )}
    </div>
  );
}