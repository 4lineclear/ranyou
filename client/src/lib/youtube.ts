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

export interface FetchedItems {
  items: PlaylistItem[];
}

export const fetchItems = async (playlistId: string): Promise<FetchedItems> => {
  const res = await fetch("/api/?playlist-id=" + playlistId);
  return await res.json();
};
