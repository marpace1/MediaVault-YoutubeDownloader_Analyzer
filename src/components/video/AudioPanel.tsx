import { useState } from 'react';
import { Music } from 'lucide-react';
import type { VideoInfo, AudioFormat, AudioBitrate, DownloadRequest } from '@shared/types';
import { Select } from '@/components/Select';
import { AUDIO_FORMATS, AUDIO_BITRATES } from '@/lib/options';
import { useDownloadStore } from '@/store/useDownloadStore';
import { useUiStore } from '@/store/useUiStore';
import { useSettingsStore } from '@/store/useSettingsStore';

/** Audio-only extraction configuration: format + bitrate. */
export function AudioPanel({ video }: { video: VideoInfo }) {
  const settings = useSettingsStore((s) => s.settings);
  const start = useDownloadStore((s) => s.start);
  const toast = useUiStore((s) => s.toast);
  const navigate = useUiStore((s) => s.navigate);

  const [format, setFormat] = useState<AudioFormat>(settings?.defaultAudioFormat ?? 'mp3');
  const [bitrate, setBitrate] = useState<AudioBitrate>(settings?.defaultAudioBitrate ?? '320');

  const lossless = format === 'wav' || format === 'flac';

  const onDownload = async () => {
    const req: DownloadRequest = {
      url: video.url,
      title: video.title,
      thumbnail: video.thumbnails.at(-1)?.url ?? null,
      channel: video.channel,
      duration: video.duration,
      options: { kind: 'audio', format, bitrate: lossless ? 'best' : bitrate },
    };
    try {
      await start(req);
      toast('Audio added to download queue', 'success');
      navigate('downloads');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to start download', 'error');
    }
  };

  return (
    <div className="glass space-y-4 rounded-2xl p-5">
      <h3 className="font-semibold">Extract audio</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <Select label="Format" value={format} options={AUDIO_FORMATS} onChange={setFormat} />
        <Select
          label="Bitrate"
          value={bitrate}
          options={AUDIO_BITRATES}
          onChange={setBitrate}
          // lossless formats ignore bitrate
        />
      </div>
      {lossless && (
        <p className="text-xs text-muted">
          {format.toUpperCase()} is lossless — bitrate selection is ignored.
        </p>
      )}
      <button onClick={onDownload} className="btn-primary w-full">
        <Music className="h-4 w-4" /> Extract Audio
      </button>
    </div>
  );
}
