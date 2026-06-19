import {
  Eye,
  ThumbsUp,
  MessageSquare,
  Calendar,
  Clock,
  User,
  Hash,
  Globe,
  Radio,
  ShieldAlert,
  Tag,
  Layers,
} from 'lucide-react';
import type { VideoInfo } from '@shared/types';
import { formatNumber, formatDuration, formatDate } from '@/lib/format';

/** Read-only analytics — flat table layout. */
export function AnalyticsPanel({ video }: { video: VideoInfo }) {
  const rows: { icon: typeof Eye; label: string; value: string }[] = [
    { icon: User, label: 'Channel', value: video.channel ?? '—' },
    { icon: Hash, label: 'Channel ID', value: video.channelId ?? '—' },
    { icon: User, label: 'Subscribers', value: formatNumber(video.subscriberCount) },
    { icon: Eye, label: 'Views', value: formatNumber(video.viewCount) },
    { icon: ThumbsUp, label: 'Likes', value: formatNumber(video.likeCount) },
    { icon: MessageSquare, label: 'Comments', value: formatNumber(video.commentCount) },
    { icon: Calendar, label: 'Uploaded', value: formatDate(video.uploadDate) },
    { icon: Clock, label: 'Duration', value: formatDuration(video.duration) },
    { icon: Layers, label: 'Category', value: video.category ?? '—' },
    { icon: Globe, label: 'Language', value: video.language?.toUpperCase() ?? '—' },
    { icon: Radio, label: 'Live', value: video.isLive ? 'Yes' : 'No' },
    {
      icon: ShieldAlert,
      label: 'Age restricted',
      value: video.ageLimit > 0 ? `Yes (${video.ageLimit}+)` : 'No',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Metadata grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {rows.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.label} className="card">
              <div className="flex items-center gap-1.5 text-muted">
                <Icon className="h-3 w-3" />
                <span className="label">{r.label}</span>
              </div>
              <p className="mt-1 truncate text-sm font-semibold text-text-primary" title={r.value}>
                {r.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Capability counts */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Capability label="Formats" value={video.formats.length} />
        <Capability label="Subtitles" value={video.subtitles.length} />
        <Capability label="Audio tracks" value={video.audioTracks.length} />
        <Capability label="Thumbnails" value={video.thumbnails.length} />
      </div>

      {/* Tags */}
      {video.tags.length > 0 && (
        <div>
          <p className="label mb-2 flex items-center gap-1.5">
            <Tag className="h-3 w-3" /> Tags
          </p>
          <div className="flex flex-wrap gap-1.5">
            {video.tags.slice(0, 24).map((tag) => (
              <span key={tag} className="chip">{tag}</span>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {video.description && (
        <div>
          <p className="label mb-2">Description</p>
          <div className="card max-h-60 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-text-secondary">
            {video.description}
          </div>
        </div>
      )}
    </div>
  );
}

function Capability({ label, value }: { label: string; value: number }) {
  return (
    <div className="card text-center">
      <p className="text-xl font-bold text-text-primary tabular-nums">{value}</p>
      <p className="label mt-1">{label}</p>
    </div>
  );
}