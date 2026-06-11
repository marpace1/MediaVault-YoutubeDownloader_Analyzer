import { motion } from 'framer-motion';
import {
  Home,
  Download,
  ListVideo,
  Music,
  Image,
  BarChart3,
  Settings,
  ChevronLeft,
} from 'lucide-react';
import { useUiStore, type Route } from '@/store/useUiStore';
import { useDownloadStore } from '@/store/useDownloadStore';
import { cn } from '@/lib/cn';

interface NavItem {
  route: Route;
  label: string;
  icon: typeof Home;
}

const NAV: NavItem[] = [
  { route: 'home', label: 'Home', icon: Home },
  { route: 'downloads', label: 'Downloads', icon: Download },
  { route: 'playlists', label: 'Playlists', icon: ListVideo },
  { route: 'audio', label: 'Audio', icon: Music },
  { route: 'thumbnails', label: 'Thumbnails', icon: Image },
  { route: 'analytics', label: 'Analytics', icon: BarChart3 },
  { route: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const route = useUiStore((s) => s.route);
  const navigate = useUiStore((s) => s.navigate);
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggle = useUiStore((s) => s.toggleSidebar);

  // Active download count -> badge on the Downloads item.
  const activeCount = useDownloadStore(
    (s) =>
      s.items.filter((i) =>
        ['downloading', 'queued', 'processing', 'paused'].includes(i.status),
      ).length,
  );

  return (
    <motion.aside
      animate={{ width: collapsed ? 76 : 232 }}
      transition={{ type: 'spring', stiffness: 360, damping: 34 }}
      className="glass relative z-20 m-3 mr-0 flex flex-col rounded-2xl p-3"
    >
      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          const active = route === item.route;
          const Icon = item.icon;
          return (
            <button
              key={item.route}
              onClick={() => navigate(item.route)}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                active ? 'text-white' : 'text-muted hover:text-white',
              )}
            >
              {active && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand-500/30 to-brand-600/10 ring-1 ring-brand-400/40"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <Icon className="relative z-10 h-5 w-5 shrink-0" />
              {!collapsed && <span className="relative z-10 truncate">{item.label}</span>}
              {item.route === 'downloads' && activeCount > 0 && (
                <span
                  className={cn(
                    'relative z-10 ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[10px] font-bold text-white',
                    collapsed && 'absolute right-1 top-1 ml-0',
                  )}
                >
                  {activeCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <button
        onClick={toggle}
        className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition hover:text-white"
      >
        <ChevronLeft
          className={cn('h-5 w-5 shrink-0 transition-transform', collapsed && 'rotate-180')}
        />
        {!collapsed && <span>Collapse</span>}
      </button>
    </motion.aside>
  );
}
