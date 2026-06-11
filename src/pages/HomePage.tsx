import { motion } from 'framer-motion';
import { Download, Film, Music, HardDrive, ArrowRight } from 'lucide-react';
import { UrlInput } from '@/components/UrlInput';
import { StatCard } from '@/components/StatCard';
import { DownloadCard } from '@/components/DownloadCard';
import { DependencyWarning } from '@/components/DependencyWarning';
import { useDownloadStore } from '@/store/useDownloadStore';
import { useUiStore } from '@/store/useUiStore';
import { formatBytes } from '@/lib/format';

export function HomePage() {
  const stats = useDownloadStore((s) => s.stats);
  const recent = useDownloadStore((s) => s.items.slice(0, 4));
  const navigate = useUiStore((s) => s.navigate);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      {/* Hero */}
      <div className="pt-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-white via-white to-brand-200 bg-clip-text text-4xl font-bold tracking-tight text-transparent"
        >
          Download anything from YouTube
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mx-auto mt-3 max-w-xl text-muted"
        >
          Videos up to 4K, lossless audio, thumbnails, subtitles and entire playlists —
          all in one beautifully fast desktop app.
        </motion.p>
      </div>

      <DependencyWarning />

      <UrlInput />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Download} label="Downloads" value={String(stats?.totalDownloads ?? 0)} accent="brand" index={0} />
        <StatCard icon={Film} label="Videos" value={String(stats?.totalVideos ?? 0)} accent="sky" index={1} />
        <StatCard icon={Music} label="Audio" value={String(stats?.totalAudio ?? 0)} accent="emerald" index={2} />
        <StatCard icon={HardDrive} label="Total Size" value={formatBytes(stats?.totalBytes)} accent="amber" index={3} />
      </div>

      {/* Recent */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent downloads</h2>
          <button
            onClick={() => navigate('downloads')}
            className="flex items-center gap-1 text-sm text-brand-400 transition hover:text-brand-300"
          >
            View all <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {recent.length === 0 ? (
          <div className="glass flex flex-col items-center justify-center rounded-2xl py-16 text-center">
            <Download className="h-10 w-10 text-muted" />
            <p className="mt-3 text-sm text-muted">No downloads yet. Paste a URL to begin.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recent.map((item) => (
              <DownloadCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
