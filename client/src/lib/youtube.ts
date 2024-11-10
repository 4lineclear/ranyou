import { PlaylistRecord, PlaylistItem } from "ranyou-shared/src/index";

export type { PlaylistItem, PlaylistRecord };
export type PlaylistRecords = Record<string, PlaylistRecord>;

export const readLocalRecords = () => {
  const records: Record<string, PlaylistRecord> = JSON.parse(
    localStorage.getItem("ranyouRecords") ?? "{}",
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
    const json: PlaylistRecord = await res.json();
    json.published_at = new Date(json.published_at);
    return json;
  }
  return res;
};

export const fetchItems = async (
  playlistId: string,
): Promise<PlaylistItem[]> => {
  const res = await fetch("/api/playlist-items/" + playlistId);
  return await res.json();
};
