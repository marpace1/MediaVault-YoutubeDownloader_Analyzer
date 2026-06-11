import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Captions, Bot } from 'lucide-react';
import type { VideoInfo, SubtitleFormat, DownloadRequest, SubtitleTrack } from '@shared/types';
import { Select } from '@/components/Select';
import { SUBTITLE_FORMATS } from '@/lib/options';
import { useDownloadStore } from '@/store/useDownloadStore';
import { useUiStore } from '@/store/useUiStore';

/** Lists every detected subtitle track and downloads in the chosen format. */
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
    return <p className="text-sm text-muted">No subtitles detected for this video.</p>;
  }

  return (
    <div className="space-y-4">
      <Select label="Download format" value={format} options={SUBTITLE_FORMATS} onChange={setFormat} className="max-w-xs" />

      {human.length > 0 && (
        <Section title="Human subtitles" tracks={human} onDownload={download} />
      )}
      {auto.length > 0 && (
        <Section title="Auto-generated" tracks={auto} onDownload={download} auto />
      )}
    </div>
  );
}

function Section({
  title,
  tracks,
  onDownload,
  auto,
}: {
  title: string;
  tracks: SubtitleTrack[];
  onDownload: (t: SubtitleTrack) => void;
  auto?: boolean;
}) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
        {auto ? <Bot className="h-3.5 w-3.5" /> : <Captions className="h-3.5 w-3.5" />}
        {title} ({tracks.length})
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {tracks.map((t, i) => (
          <motion.button
            key={`${t.lang}-${i}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            onClick={() => onDownload(t)}
            className="glass flex items-center justify-between rounded-lg px-3 py-2 text-sm transition hover:bg-white/10"
          >
            <span className="truncate">{t.langName || t.lang}</span>
            <Download className="h-3.5 w-3.5 shrink-0 text-muted" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
