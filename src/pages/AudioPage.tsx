import { useUiStore } from '@/store/useUiStore';
import { UrlInput } from '@/components/UrlInput';
import { AudioPanel } from '@/components/video/AudioPanel';
import { EmptyState, ASCII } from '@/components/EmptyState';

/** Dedicated audio extraction workspace. */
export function AudioPage() {
  const video = useUiStore((s) => s.currentVideo);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <h1 className="section-title">Audio</h1>
      <p className="text-xs text-text-secondary">
        Extract high-quality audio in MP3, FLAC, WAV and more.
      </p>

      <div className="divider" />
      <UrlInput autoFocus={false} />

      {video ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <div className="card overflow-hidden p-0">
            <div className="relative aspect-video bg-surface-2">
              {video.thumbnails.at(-1)?.url && (
                <img src={video.thumbnails.at(-1)!.url} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="p-3">
              <p className="truncate text-xs font-semibold text-text-primary">{video.title}</p>
              <p className="truncate text-[10px] text-muted">{video.channel}</p>
            </div>
          </div>
          <AudioPanel video={video} />
        </div>
      ) : (
        <EmptyState
          ascii={ASCII.audio}
          message="Analyze a video to extract its audio."
        />
      )}
    </div>
  );
}