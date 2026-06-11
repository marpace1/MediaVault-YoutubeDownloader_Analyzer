import { Image as ImageIcon } from 'lucide-react';
import { useUiStore } from '@/store/useUiStore';
import { UrlInput } from '@/components/UrlInput';
import { ThumbnailPanel } from '@/components/video/ThumbnailPanel';
import { EmptyState } from '@/components/EmptyState';

/** Dedicated thumbnail browser/downloader. */
export function ThumbnailsPage() {
  const video = useUiStore((s) => s.currentVideo);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Thumbnails</h1>
        <p className="mt-1 text-sm text-muted">Download thumbnails in every available resolution.</p>
      </div>

      <UrlInput autoFocus={false} />

      {video ? (
        <ThumbnailPanel video={video} />
      ) : (
        <EmptyState icon={ImageIcon} message="Analyze a video to browse its thumbnails." />
      )}
    </div>
  );
}
