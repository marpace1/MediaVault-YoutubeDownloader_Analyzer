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

/** Read-only analytics grid summarising everything yt-dlp exposes. */
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {rows.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.label} className="glass rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 text-muted">
                <Icon className="h-3.5 w-3.5" />
                <span className="text-[11px] font-medium uppercase tracking-wide">{r.label}</span>
              </div>
              <p className="mt-1 truncate text-sm font-semibold" title={r.value}>
                {r.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Quick capability summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Capability label="Formats" value={video.formats.length} />
        <Capability label="Subtitles" value={video.subtitles.length} />
        <Capability label="Audio tracks" value={video.audioTracks.length} />
        <Capability label="Thumbnails" value={video.thumbnails.length} />
      </div>

      {/* Tags */}
      {video.tags.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
            <Tag className="h-3.5 w-3.5" /> Tags
          </p>
          <div className="flex flex-wrap gap-1.5">
            {video.tags.slice(0, 24).map((tag) => (
              <span key={tag} className="chip">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {video.description && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Description</p>
          <div className="glass max-h-60 overflow-auto whitespace-pre-wrap rounded-xl p-4 text-sm leading-relaxed text-muted">
            {video.description}
          </div>
        </div>
      )}
    </div>
  );
}

function Capability({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass rounded-xl p-3.5 text-center">
      <p className="text-2xl font-bold tracking-tight text-brand-300">{value}</p>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</p>
    </div>
  );
}
