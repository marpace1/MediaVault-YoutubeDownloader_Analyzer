import { Suspense, lazy, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TitleBar } from '@/components/TitleBar';
import { Sidebar } from '@/components/Sidebar';
import { Toasts } from '@/components/Toasts';
import { UpdateBanner } from '@/components/UpdateBanner';
import { Skeleton } from '@/components/Skeleton';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useUiStore, type Route } from '@/store/useUiStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useDownloadStore } from '@/store/useDownloadStore';

// Lazy-load pages -> smaller initial bundle, faster startup.
const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })));
const VideoPage = lazy(() => import('@/pages/VideoPage').then((m) => ({ default: m.VideoPage })));
const DownloadsPage = lazy(() => import('@/pages/DownloadsPage').then((m) => ({ default: m.DownloadsPage })));
const PlaylistsPage = lazy(() => import('@/pages/PlaylistsPage').then((m) => ({ default: m.PlaylistsPage })));
const AudioPage = lazy(() => import('@/pages/AudioPage').then((m) => ({ default: m.AudioPage })));
const ThumbnailsPage = lazy(() => import('@/pages/ThumbnailsPage').then((m) => ({ default: m.ThumbnailsPage })));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));

const PAGES: Record<Route, React.ComponentType> = {
  home: HomePage,
  video: VideoPage,
  downloads: DownloadsPage,
  playlists: PlaylistsPage,
  audio: AudioPage,
  thumbnails: ThumbnailsPage,
  analytics: AnalyticsPage,
  settings: SettingsPage,
};

export function App() {
  const route = useUiStore((s) => s.route);
  const loadSettings = useSettingsStore((s) => s.load);
  const initDownloads = useDownloadStore((s) => s.init);
  const Page = PAGES[route];

  // Bootstrap stores once on mount.
  useEffect(() => {
    loadSettings();
    initDownloads();
  }, [loadSettings, initDownloads]);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <AnimatedBackground />
      <TitleBar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-hidden p-3">
          <div className="glass h-full overflow-auto rounded-2xl p-6">
            <ErrorBoundary key={route}>
              {/*
                Suspense MUST sit OUTSIDE AnimatePresence/motion. A lazy page
                suspending inside the animated element orphans Framer Motion's
                enter animation, leaving the page stuck at opacity:0 (blank
                content, visible sidebar). With Suspense outside, the fallback
                cleanly replaces the tree while a chunk loads, then the page
                mounts and animates in normally.
              */}
              <Suspense fallback={<PageFallback />}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={route}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full"
                  >
                    <Page />
                  </motion.div>
                </AnimatePresence>
              </Suspense>
            </ErrorBoundary>
          </div>
        </main>
      </div>

      <Toasts />
      <UpdateBanner />
    </div>
  );
}

function PageFallback() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <Skeleton className="h-12 w-full rounded-2xl" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}
