import { useState } from 'react';
import { Download } from 'lucide-react';
import type {
  VideoInfo,
  VideoQuality,
  VideoContainer,
  DownloadRequest,
} from '@shared/types';
import { Select } from '@/components/Select';
import { VIDEO_QUALITIES, VIDEO_CONTAINERS } from '@/lib/options';
import { useDownloadStore } from '@/store/useDownloadStore';
import { useUiStore } from '@/store/useUiStore';
import { useSettingsStore } from '@/store/useSettingsStore';

/** Video download configuration: quality + container + custom name. */
export function QualityPanel({ video }: { video: VideoInfo }) {
  const settings = useSettingsStore((s) => s.settings);
  const start = useDownloadStore((s) => s.start);
  const toast = useUiStore((s) => s.toast);
  const navigate = useUiStore((s) => s.navigate);

  const [quality, setQuality] = useState<VideoQuality>(settings?.defaultVideoQuality ?? '1080');
  const [container, setContainer] = useState<VideoContainer>(
    settings?.defaultVideoContainer ?? 'mp4',
  );
  const [customName, setCustomName] = useState('');

  // Mark qualities above the source's max as disabled hints.
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
    <div className="glass space-y-4 rounded-2xl p-5">
      <h3 className="font-semibold">Download video</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <Select label="Quality" value={quality} options={qualityOptions} onChange={setQuality} />
        <Select label="Format" value={container} options={VIDEO_CONTAINERS} onChange={setContainer} />
      </div>
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted">Rename (optional)</p>
        <input
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          placeholder={video.title}
          className="input-field"
        />
      </div>
      <button onClick={onDownload} className="btn-primary w-full">
        <Download className="h-4 w-4" /> Download Video
      </button>
    </div>
  );
}
