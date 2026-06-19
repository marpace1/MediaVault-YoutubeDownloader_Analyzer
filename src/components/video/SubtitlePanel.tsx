import { useState } from 'react';
import { Download, Captions, Bot } from 'lucide-react';
import type { VideoInfo, SubtitleFormat, DownloadRequest, SubtitleTrack } from '@shared/types';
import { Select } from '@/components/Select';
import { SUBTITLE_FORMATS } from '@/lib/options';
import { useDownloadStore } from '@/store/useDownloadStore';
import { useUiStore } from '@/store/useUiStore';

/** Subtitle track list — flat table with one-click download. */
export function SubtitlePanel({ video }: { video: VideoInfo }) {
  const start = useDownloadStore((s) => s.start);
  const toast = useUiStore((s) => s.toast);
  const [format, setFormat] = useState<SubtitleFormat>('srt');

  const human = video.subtitles.filter((s) => !s.auto);
  const auto = video.subtitles.filter((s) => s.auto);

  const download = async (track: SubtitleTrack) => {
    const req: DownloadRequest = {
      url: video.url,
      title: `${video.title} [${track.lang}]`,
      thumbnail: video.thumbnails.at(-1)?.url ?? null,
      channel: video.channel,
      duration: video.duration,
      options: { kind: 'subtitle', lang: track.lang, format, auto: track.auto },
    };
    try {
      await start(req);
      toast(`Subtitle (${track.lang.toUpperCase()}) download started`, 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  };

  if (video.subtitles.length === 0) {
    return <p className="text-xs text-text-secondary">No subtitles detected for this video.</p>;
  }

  return (
    <div className="space-y-4">
      <Select label="Download Format" value={format} options={SUBTITLE_FORMATS} onChange={setFormat} className="max-w-xs" />

      {human.length > 0 && (
        <Section title="Human subtitles" icon={<Captions className="h-3 w-3" />} tracks={human} onDownload={download} />
      )}
      {auto.length > 0 && (
        <Section title="Auto-generated" icon={<Bot className="h-3 w-3" />} tracks={auto} onDownload={download} />
      )}
    </div>
  );
}

function Section({
  title,
  icon,
  tracks,
  onDownload,
}: {
  title: string;
  icon: React.ReactNode;
  tracks: SubtitleTrack[];
  onDownload: (t: SubtitleTrack) => void;
}) {
  return (
    <div>
      <p className="label mb-2 flex items-center gap-1.5">
        {icon}
        {title} ({tracks.length})
      </p>
      <div className="border border-border">
        {tracks.map((t, i) => (
          <button
            key={`${t.lang}-${i}`}
            onClick={() => onDownload(t)}
            className="flex w-full items-center justify-between border-b border-border px-3 py-2 text-xs text-text-secondary transition-colors duration-100 hover:bg-hover last:border-b-0"
          >
            <span>{t.langName || t.lang}</span>
            <Download className="h-3 w-3 text-muted" />
          </button>
        ))}
      </div>
    </div>
  );
}