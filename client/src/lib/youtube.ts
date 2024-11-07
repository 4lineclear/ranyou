export interface PlaylistItem {
  video_id: string;
  title: string;
  description: string;
  note: string;
  position: number;
  channel_title: string;
  channel_id: string;
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

export const fetchRecords = async (
  playlistId: string,
): Promise<PlaylistRecord | number> => {
  const res = await fetch("/api/playlist-record/" + playlistId);
  if (res.status === 200) {
    return await res.json();
  }
  return res.status;
};

export const fetchItems = async (
  playlistId: string,
): Promise<PlaylistItem[]> => {
  const res = await fetch("/api/playlist-items/" + playlistId);
  return await res.json();
};
