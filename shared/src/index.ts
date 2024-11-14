function pick<T, K extends keyof T>(obj: T, ...keys: K[]): Pick<T, K> {
  const copy = {} as Pick<T, K>;
  keys.forEach((key) => (copy[key] = obj[key]));
  return copy;
}

export interface PlaylistItem {
  video_id: string;
  title: string;
  description: string;
  note: string;
  position: number;
  channel_title: string;
  channel_id: string;
  duration: string;
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
  thumbnail: string;
  playlist_length: number;
}

export const isPlaylistRecord = (obj: unknown): obj is PlaylistRecord => {
  if (typeof obj !== "object") return false;
  if (obj === null) return false;
  return Object.values([
    "playlist_id",
    "published_at",
    "channel_id",
    "channel_title",
    "title",
    "description",
    "privacy_status",
    "thumbnail",
    "playlist_length",
  ]).every((k) => k in obj);
};
