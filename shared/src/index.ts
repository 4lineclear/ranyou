export interface PlaylistItem {
  video_id: string;
  title: string;
  description: string;
  note: string;
  position: number;
  channel_title: string;
  channel_id: string;
  duration: number;
  added_at: Date;
  published_at: Date;
}

export interface PlaylistRecord {
  playlist_id: string;
  published_at: Date;
  channel_id: string;
  channel_title: string;
  title: string;
  description: string;
  privacy_status: string;
  thumbnail?: string;
  playlist_length: number;
}
