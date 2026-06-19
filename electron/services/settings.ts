/**
 * Settings service: persists the AppSettings object to SQLite (as a single
 * JSON blob) and merges it with sensible defaults on read.
 */
import { app } from 'electron';
import { join } from 'node:path';
import type { AppSettings } from '../../shared/types';
import { getSetting, setSetting } from '../db/database';

const SETTINGS_KEY = 'app_settings';

export function defaultSettings(): AppSettings {
  return {
    downloadDir: join(app.getPath('downloads'), 'MediaVault'),
    theme: 'dark',
    ffmpegPath: null,
    ytDlpPath: null,
    concurrentLimit: 3,
    language: 'en',
    autoCreateFolders: true,
    clipboardDetection: true,
    embedThumbnail: true,
    embedMetadata: true,
    defaultVideoQuality: '1080',
    defaultVideoContainer: 'mp4',
    defaultAudioFormat: 'mp3',
    defaultAudioBitrate: '320',
  };
}

export function readSettings(): AppSettings {
  const raw = getSetting(SETTINGS_KEY);
  if (!raw) return defaultSettings();
  try {
    return { ...defaultSettings(), ...(JSON.parse(raw) as Partial<AppSettings>) };
  } catch {
    return defaultSettings();
  }
}

export function writeSettings(patch: Partial<AppSettings>): AppSettings {
  const merged = { ...readSettings(), ...patch };
  // Clamp concurrency to a safe range to protect against UI tampering.
  merged.concurrentLimit = Math.min(10, Math.max(1, Math.floor(merged.concurrentLimit)));
  setSetting(SETTINGS_KEY, JSON.stringify(merged));
  return merged;
}
