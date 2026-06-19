/**
 * SQLite persistence layer (better-sqlite3 — synchronous, fast, embedded).
 *
 * Stores: download history + key/value settings. The synchronous API is fine
 * here because each query is sub-millisecond and runs in the main process
 * outside the render loop.
 */
import Database from 'better-sqlite3';
import { app } from 'electron';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
import type { DownloadItem, AppStatistics } from '../../shared/types';
import { createLogger } from '../utils/logger';

const log = createLogger('db');

let db: Database.Database;

export function initDatabase(): void {
  const dir = app.getPath('userData');
  mkdirSync(dir, { recursive: true });
  const file = join(dir, 'mediavault.db');

  db = new Database(file);
  db.pragma('journal_mode = WAL'); // concurrent reads, durable writes
  db.pragma('synchronous = NORMAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS downloads (
      id           TEXT PRIMARY KEY,
      url          TEXT NOT NULL,
      title        TEXT NOT NULL,
      thumbnail    TEXT,
      channel      TEXT,
      kind         TEXT NOT NULL,
      format_label TEXT NOT NULL,
      status       TEXT NOT NULL,
      file_path    TEXT,
      file_size    INTEGER,
      error        TEXT,
      created_at   INTEGER NOT NULL,
      completed_at INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_downloads_created ON downloads(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_downloads_status  ON downloads(status);

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  log.info('database ready at', file);
}

/* --------------------------- download history ---------------------------- */

export function upsertDownload(item: DownloadItem): void {
  db.prepare(
    `INSERT INTO downloads
       (id, url, title, thumbnail, channel, kind, format_label, status, file_path, file_size, error, created_at, completed_at)
     VALUES
       (@id, @url, @title, @thumbnail, @channel, @kind, @formatLabel, @status, @filePath, @fileSize, @error, @createdAt, @completedAt)
     ON CONFLICT(id) DO UPDATE SET
       status       = excluded.status,
       file_path    = excluded.file_path,
       file_size    = excluded.file_size,
       error        = excluded.error,
       completed_at = excluded.completed_at`,
  ).run({
    id: item.id,
    url: item.url,
    title: item.title,
    thumbnail: item.thumbnail,
    channel: item.channel,
    kind: item.kind,
    formatLabel: item.formatLabel,
    status: item.status,
    filePath: item.filePath,
    fileSize: item.fileSize,
    error: item.error,
    createdAt: item.createdAt,
    completedAt: item.completedAt,
  });
}

interface DownloadRow {
  id: string;
  url: string;
  title: string;
  thumbnail: string | null;
  channel: string | null;
  kind: string;
  format_label: string;
  status: string;
  file_path: string | null;
  file_size: number | null;
  error: string | null;
  created_at: number;
  completed_at: number | null;
}

function rowToItem(r: DownloadRow): DownloadItem {
  return {
    id: r.id,
    url: r.url,
    title: r.title,
    thumbnail: r.thumbnail,
    channel: r.channel,
    kind: r.kind as DownloadItem['kind'],
    formatLabel: r.format_label,
    status: r.status as DownloadItem['status'],
    progress: {
      percent: r.status === 'completed' ? 100 : 0,
      speed: null,
      eta: null,
      downloadedBytes: r.file_size,
      totalBytes: r.file_size,
    },
    filePath: r.file_path,
    fileSize: r.file_size,
    error: r.error,
    createdAt: r.created_at,
    completedAt: r.completed_at,
  };
}

export function getDownloadHistory(limit = 500): DownloadItem[] {
  const rows = db
    .prepare('SELECT * FROM downloads ORDER BY created_at DESC LIMIT ?')
    .all(limit) as DownloadRow[];
  return rows.map(rowToItem);
}

export function findDuplicate(url: string, formatLabel: string): DownloadItem | null {
  const row = db
    .prepare(
      "SELECT * FROM downloads WHERE url = ? AND format_label = ? AND status = 'completed' LIMIT 1",
    )
    .get(url, formatLabel) as DownloadRow | undefined;
  return row ? rowToItem(row) : null;
}

export function removeDownload(id: string): void {
  db.prepare('DELETE FROM downloads WHERE id = ?').run(id);
}

export function clearCompleted(): void {
  db.prepare("DELETE FROM downloads WHERE status IN ('completed','failed','canceled')").run();
}

export function getStatistics(): AppStatistics {
  const total = db
    .prepare("SELECT COUNT(*) c, COALESCE(SUM(file_size),0) b FROM downloads WHERE status='completed'")
    .get() as { c: number; b: number };
  const byKind = db
    .prepare("SELECT kind, COUNT(*) c FROM downloads WHERE status='completed' GROUP BY kind")
    .all() as { kind: string; c: number }[];

  const map = new Map(byKind.map((k) => [k.kind, k.c]));
  return {
    totalDownloads: total.c,
    totalVideos: map.get('video') ?? 0,
    totalAudio: map.get('audio') ?? 0,
    totalThumbnails: map.get('thumbnail') ?? 0,
    totalBytes: total.b,
  };
}

/* ------------------------------- settings -------------------------------- */

export function getSetting(key: string): string | null {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as
    | { value: string }
    | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  ).run(key, value);
}
