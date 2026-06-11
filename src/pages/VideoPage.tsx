import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, ThumbsUp, Clock, Calendar, PlayCircle, ArrowLeft } from 'lucide-react';
import { useUiStore } from '@/store/useUiStore';
import { UrlInput } from '@/components/UrlInput';
import { VideoSkeleton } from '@/components/Skeleton';
import { QualityPanel } from '@/components/video/QualityPanel';
import { AudioPanel } from '@/components/video/AudioPanel';
import { ThumbnailPanel } from '@/components/video/ThumbnailPanel';
import { SubtitlePanel } from '@/components/video/SubtitlePanel';
import { AnalyticsPanel } from '@/components/video/AnalyticsPanel';
import { formatNumber, formatDuration, formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';

type Tab = 'download' | 'thumbnails' | 'subtitles' | 'analytics';

const TABS: { id: Tab; label: string }[] = [
  { id: 'download', label: 'Download' },
  { id: 'thumbnails', label: 'Thumbnails' },
  { id: 'subtitles', label: 'Subtitles' },
  { id: 'analytics', label: 'Analytics' },
];

export function VideoPage() {
  const video = useUiStore((s) => s.currentVideo);
  const analyzing = useUiStore((s) => s.analyzing);
  const navigate = useUiStore((s) => s.navigate);
  const [tab, setTab] = useState<Tab>('download');

  if (analyzing) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <UrlInput autoFocus={false} />
        <VideoSkeleton />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <UrlInput autoFocus={false} />
        <div className="glass flex flex-col items-center justify-center rounded-2xl py-20 text-center">
          <PlayCircle className="h-10 w-10 text-muted" />
          <p className="mt-3 text-sm text-muted">Analyze a video to see download options.</p>
        </div>
      </div>
    );
  }

  const bestThumb = video.thumbnails.at(-1)?.url ?? null;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <button
        onClick={() => navigate('home')}
        className="flex items-center gap-1.5 text-sm text-muted transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-6 lg:grid-cols-[1.4fr_1fr]"
      >
        <div className="glass overflow-hidden rounded-2xl">
          <div className="relative aspect-video bg-black/40">
            {bestThumb && <img src={bestThumb} alt={video.title} className="h-full w-full object-cover" />}
            {video.durationString && (
              <span className="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-0.5 text-xs font-medium">
                {video.durationString}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <h1 className="text-xl font-bold leading-tight">{video.title}</h1>
          <p className="mt-1.5 text-sm text-muted">{video.channel}</p>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <Meta icon={Eye} label="Views" value={formatNumber(video.viewCount)} />
            <Meta icon={ThumbsUp} label="Likes" value={formatNumber(video.likeCount)} />
            <Meta icon={Clock} label="Duration" value={formatDuration(video.duration)} />
            <Meta icon={Calendar} label="Uploaded" value={formatDate(video.uploadDate)} />
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-white/10 bg-black/20 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'relative flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              tab === t.id ? 'text-white' : 'text-muted hover:text-white',
            )}
          >
            {tab === t.id && (
              <motion.div
                layoutId="video-tab"
                className="absolute inset-0 rounded-lg bg-gradient-to-r from-brand-500/40 to-brand-600/20 ring-1 ring-brand-400/40"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {tab === 'download' && (
            <div className="grid gap-4 lg:grid-cols-2">
              <QualityPanel video={video} />
              <AudioPanel video={video} />
            </div>
          )}
          {tab === 'thumbnails' && <ThumbnailPanel video={video} />}
          {tab === 'subtitles' && <SubtitlePanel video={video} />}
          {tab === 'analytics' && <AnalyticsPanel video={video} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Meta({ icon: Icon, label, value }: { icon: typeof Eye; label: string; value: string }) {
  return (
    <div className="glass rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-muted">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[11px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  );
}
