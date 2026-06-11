import { Music } from 'lucide-react';
import { useUiStore } from '@/store/useUiStore';
import { UrlInput } from '@/components/UrlInput';
import { AudioPanel } from '@/components/video/AudioPanel';
import { EmptyState } from '@/components/EmptyState';

/** Dedicated audio extraction workspace. */
export function AudioPage() {
  const video = useUiStore((s) => s.currentVideo);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audio</h1>
        <p className="mt-1 text-sm text-muted">Extract high-quality audio in MP3, FLAC, WAV and more.</p>
      </div>

      <UrlInput autoFocus={false} />

      {video ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <div className="glass overflow-hidden rounded-2xl">
            <div className="relative aspect-video bg-black/40">
              {video.thumbnails.at(-1)?.url && (
                <img src={video.thumbnails.at(-1)!.url} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="p-4">
              <p className="truncate text-sm font-semibold">{video.title}</p>
              <p className="truncate text-xs text-muted">{video.channel}</p>
            </div>
          </div>
          <AudioPanel video={video} />
        </div>
      ) : (
        <EmptyState icon={Music} message="Analyze a video to extract its audio." />
      )}
    </div>
  );
}
