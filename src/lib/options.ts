/** Predefined option lists for the quality / format selectors. */
import type {
  VideoQuality,
  VideoContainer,
  AudioFormat,
  AudioBitrate,
  SubtitleFormat,
} from '@shared/types';
import type { SelectOption } from '@/components/Select';

export const VIDEO_QUALITIES: SelectOption<VideoQuality>[] = [
  { value: 'best', label: 'Best Available', hint: 'Highest quality' },
  { value: '2160', label: '2160p (4K)', hint: 'Ultra HD' },
  { value: '1440', label: '1440p (2K)', hint: 'Quad HD' },
  { value: '1080', label: '1080p', hint: 'Full HD' },
  { value: '720', label: '720p', hint: 'HD' },
  { value: '480', label: '480p', hint: 'SD' },
  { value: '360', label: '360p' },
  { value: '240', label: '240p' },
  { value: '144', label: '144p', hint: 'Lowest' },
];

export const VIDEO_CONTAINERS: SelectOption<VideoContainer>[] = [
  { value: 'mp4', label: 'MP4', hint: 'Most compatible' },
  { value: 'mkv', label: 'MKV', hint: 'Best for high quality' },
];

export const AUDIO_FORMATS: SelectOption<AudioFormat>[] = [
  { value: 'mp3', label: 'MP3', hint: 'Universal' },
  { value: 'm4a', label: 'M4A', hint: 'AAC in MP4' },
  { value: 'aac', label: 'AAC' },
  { value: 'wav', label: 'WAV', hint: 'Lossless, large' },
  { value: 'flac', label: 'FLAC', hint: 'Lossless' },
  { value: 'ogg', label: 'OGG', hint: 'Vorbis' },
];

export const AUDIO_BITRATES: SelectOption<AudioBitrate>[] = [
  { value: 'best', label: 'Best Available' },
  { value: '320', label: '320 kbps', hint: 'Studio' },
  { value: '256', label: '256 kbps' },
  { value: '192', label: '192 kbps', hint: 'Standard' },
  { value: '128', label: '128 kbps', hint: 'Compact' },
];

export const SUBTITLE_FORMATS: SelectOption<SubtitleFormat>[] = [
  { value: 'srt', label: 'SRT', hint: 'SubRip' },
  { value: 'vtt', label: 'VTT', hint: 'WebVTT' },
  { value: 'txt', label: 'TXT', hint: 'Plain text' },
];
