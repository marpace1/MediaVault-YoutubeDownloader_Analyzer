import { BarChart3 } from 'lucide-react';
import { useUiStore } from '@/store/useUiStore';
import { UrlInput } from '@/components/UrlInput';
import { AnalyticsPanel } from '@/components/video/AnalyticsPanel';
import { EmptyState } from '@/components/EmptyState';

/** Full analytics inspector for the currently analyzed video. */
export function AnalyticsPage() {
  const video = useUiStore((s) => s.currentVideo);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-muted">Deep metadata insights for any video.</p>
      </div>

      <UrlInput autoFocus={false} />

      {video ? (
        <>
          <div className="glass flex items-center gap-4 rounded-2xl p-4">
            {video.thumbnails.at(-1)?.url && (
              <img
                src={video.thumbnails.at(-1)!.url}
                alt=""
                className="h-16 w-28 shrink-0 rounded-lg object-cover"
              />
            )}
            <div className="min-w-0">
              <p className="truncate font-semibold">{video.title}</p>
              <p className="truncate text-sm text-muted">{video.channel}</p>
            </div>
          </div>
          <AnalyticsPanel video={video} />
        </>
      ) : (
        <EmptyState icon={BarChart3} message="Analyze a video to view detailed analytics." />
      )}
    </div>
  );
}
