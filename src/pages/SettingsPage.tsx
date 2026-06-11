import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FolderOpen,
  Moon,
  Sun,
  Monitor,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Terminal,
  Film,
} from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useUiStore } from '@/store/useUiStore';
import { Select } from '@/components/Select';
import { cn } from '@/lib/cn';
import type { ThemeMode } from '@shared/types';
import {
  VIDEO_QUALITIES,
  VIDEO_CONTAINERS,
  AUDIO_FORMATS,
  AUDIO_BITRATES,
} from '@/lib/options';

const THEMES: { id: ThemeMode; label: string; icon: typeof Moon }[] = [
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'system', label: 'System', icon: Monitor },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'pt', label: 'Português' },
  { value: 'hi', label: 'हिन्दी' },
  { value: 'ja', label: '日本語' },
  { value: 'zh', label: '中文' },
];

export function SettingsPage() {
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const deps = useSettingsStore((s) => s.deps);
  const refreshDeps = useSettingsStore((s) => s.refreshDeps);
  const toast = useUiStore((s) => s.toast);
  const [checking, setChecking] = useState(false);

  if (!settings) return null;

  const pickDir = async () => {
    const dir = await window.mediavault.pickDirectory();
    if (dir) {
      await update({ downloadDir: dir });
      toast('Download folder updated', 'success');
    }
  };

  const pickBinary = async (key: 'ffmpegPath' | 'ytDlpPath') => {
    const file = await window.mediavault.pickFile();
    if (file) {
      await update({ [key]: file });
      await refreshDeps();
      toast('Binary path updated', 'success');
    }
  };

  const recheck = async () => {
    setChecking(true);
    await refreshDeps();
    setChecking(false);
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      {/* Dependencies */}
      <Section title="Engine status">
        <div className="space-y-2.5">
          <DepRow
            name="yt-dlp"
            available={deps?.ytDlp.available ?? false}
            version={deps?.ytDlp.version}
            path={deps?.ytDlp.path}
            onPick={() => pickBinary('ytDlpPath')}
          />
          <DepRow
            name="FFmpeg"
            available={deps?.ffmpeg.available ?? false}
            version={deps?.ffmpeg.version}
            path={deps?.ffmpeg.path}
            onPick={() => pickBinary('ffmpegPath')}
          />
        </div>
        <button onClick={recheck} className="btn-ghost mt-3 text-xs" disabled={checking}>
          <RefreshCw className={cn('h-3.5 w-3.5', checking && 'animate-spin')} /> Re-check
        </button>
      </Section>

      {/* Download directory */}
      <Section title="Downloads">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1 truncate rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm">
            {settings.downloadDir}
          </div>
          <button onClick={pickDir} className="btn-ghost shrink-0">
            <FolderOpen className="h-4 w-4" /> Change
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Toggle
            label="Auto-create folders"
            checked={settings.autoCreateFolders}
            onChange={(v) => update({ autoCreateFolders: v })}
          />
          <Toggle
            label="Clipboard detection"
            checked={settings.clipboardDetection}
            onChange={(v) => update({ clipboardDetection: v })}
          />
          <Toggle
            label="Embed thumbnail"
            checked={settings.embedThumbnail}
            onChange={(v) => update({ embedThumbnail: v })}
          />
          <Toggle
            label="Embed metadata"
            checked={settings.embedMetadata}
            onChange={(v) => update({ embedMetadata: v })}
          />
        </div>

        <div className="mt-4">
          <p className="mb-1.5 text-xs font-medium text-muted">
            Concurrent downloads: {settings.concurrentLimit}
          </p>
          <input
            type="range"
            min={1}
            max={10}
            value={settings.concurrentLimit}
            onChange={(e) => update({ concurrentLimit: Number(e.target.value) })}
            className="w-full accent-brand-500"
          />
        </div>
      </Section>

      {/* Defaults */}
      <Section title="Default formats">
        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Video quality"
            value={settings.defaultVideoQuality}
            options={VIDEO_QUALITIES}
            onChange={(v) => update({ defaultVideoQuality: v })}
          />
          <Select
            label="Video container"
            value={settings.defaultVideoContainer}
            options={VIDEO_CONTAINERS}
            onChange={(v) => update({ defaultVideoContainer: v })}
          />
          <Select
            label="Audio format"
            value={settings.defaultAudioFormat}
            options={AUDIO_FORMATS}
            onChange={(v) => update({ defaultAudioFormat: v })}
          />
          <Select
            label="Audio bitrate"
            value={settings.defaultAudioBitrate}
            options={AUDIO_BITRATES}
            onChange={(v) => update({ defaultAudioBitrate: v })}
          />
        </div>
      </Section>

      {/* Appearance */}
      <Section title="Appearance">
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map((t) => {
            const Icon = t.icon;
            const active = settings.theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => update({ theme: t.id })}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border p-4 transition',
                  active
                    ? 'border-brand-400/60 bg-brand-500/15 text-white'
                    : 'border-white/10 bg-white/5 text-muted hover:text-white',
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{t.label}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-4">
          <Select
            label="Language"
            value={settings.language}
            options={LANGUAGES}
            onChange={(v) => update({ language: v })}
            className="max-w-xs"
          />
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5"
    >
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">{title}</h2>
      {children}
    </motion.div>
  );
}

function DepRow({
  name,
  available,
  version,
  path,
  onPick,
}: {
  name: string;
  available: boolean;
  version: string | null | undefined;
  path: string | null | undefined;
  onPick: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
      {name === 'FFmpeg' ? (
        <Film className="h-5 w-5 shrink-0 text-muted" />
      ) : (
        <Terminal className="h-5 w-5 shrink-0 text-muted" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{name}</span>
          {available ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <XCircle className="h-4 w-4 text-rose-400" />
          )}
        </div>
        <p className="truncate text-xs text-muted" title={path ?? ''}>
          {available ? version ?? 'detected' : 'Not found — set a custom path'}
        </p>
      </div>
      <button onClick={onPick} className="btn-ghost shrink-0 text-xs">
        Set path
      </button>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm transition hover:bg-white/5"
    >
      <span>{label}</span>
      <span
        className={cn(
          'relative h-5 w-9 rounded-full transition-colors',
          checked ? 'bg-brand-500' : 'bg-white/15',
        )}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow',
            checked ? 'left-[18px]' : 'left-0.5',
          )}
        />
      </span>
    </button>
  );
}
