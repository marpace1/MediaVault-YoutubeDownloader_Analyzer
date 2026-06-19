import { useState } from 'react';
import { Download } from 'lucide-react';
import type { VideoInfo, VideoQuality, VideoContainer, DownloadRequest } from '@shared/types';
import { Select } from '@/components/Select';
import { VIDEO_QUALITIES, VIDEO_CONTAINERS } from '@/lib/options';
import { useDownloadStore } from '@/store/useDownloadStore';
import { useUiStore } from '@/store/useUiStore';
import { useSettingsStore } from '@/store/useSettingsStore';

/** Video download configuration — monochrome card. */
export function QualityPanel({ video }: { video: VideoInfo }) {
  const settings = useSettingsStore((s) => s.settings);
  const start = useDownloadStore((s) => s.start);
  const toast = useUiStore((s) => s.toast);
  const navigate = useUiStore((s) => s.navigate);

  const [quality, setQuality] = useState<VideoQuality>(settings?.defaultVideoQuality ?? '1080');
  const [container, setContainer] = useState<VideoContainer>(settings?.defaultVideoContainer ?? 'mp4');
  const [customName, setCustomName] = useState('');

  const maxHeight = Math.max(0, ...video.formats.map((f) => f.height ?? 0));
  const qualityOptions = VIDEO_QUALITIES.map((o) =>
    o.value !== 'best' && Number(o.value) > maxHeight
      ? { ...o, hint: 'Not available', disabled: true }
      : o,
  );

  const onDownload = async () => {
    const req: DownloadRequest = {
      url: video.url,
      title: video.title,
      thumbnail: video.thumbnails.at(-1)?.url ?? null,
      channel: video.channel,
      duration: video.duration,
      options: { kind: 'video', quality, container },
      ...(customName.trim() ? { customName: customName.trim() } : {}),
    };
    try {
      await start(req);
      toast('Added to download queue', 'success');
      navigate('downloads');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to start download', 'error');
    }
  };

  return (
    <div className="card space-y-4">
      <p className="label">Download Video</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Select label="Quality" value={quality} options={qualityOptions} onChange={setQuality} />
        <Select label="Container" value={container} options={VIDEO_CONTAINERS} onChange={setContainer} />
      </div>
      <div>
        <p className="label mb-1.5">Rename (optional)</p>
        <input
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          placeholder={video.title}
          className="input-bordered"
        />
      </div>
      <button onClick={onDownload} className="btn-primary w-full">
        <Download className="h-3.5 w-3.5" /> Download Video
      </button>
    </div>
  );
}