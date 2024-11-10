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

export type PlaylistRecords = Record<string, PlaylistRecord>;

export const readLocalRecords = () => {
  const records: Record<string, PlaylistRecord> = JSON.parse(
    localStorage.getItem("ranyouRecords") ?? "[]",
  );
  for (const key in records) {
    records[key].published_at = new Date(records[key].published_at);
  }
  return records;
};

export const writeLocalRecords = (records: PlaylistRecords) => {
  localStorage.setItem("ranyouRecords", JSON.stringify(records));
};

export const fetchRecords = async (
  playlistId: string,
): Promise<PlaylistRecord | Response> => {
  const res = await fetch("/api/playlist-record/" + playlistId);
  if (res.status === 200) {
    return await res.json();
  }
  return res;
};

export const fetchItems = async (
  playlistId: string,
): Promise<PlaylistItem[]> => {
  const res = await fetch("/api/playlist-items/" + playlistId);
  return await res.json();
};
