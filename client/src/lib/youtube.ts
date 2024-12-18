import {
  PlaylistRecord,
  PlaylistItem,
  isPlaylistRecord,
} from "ranyou-shared/src/index";
import { db } from "./db";

export type { PlaylistItem, PlaylistRecord };
export type PlaylistRecords = Record<string, PlaylistRecord>;

export const readLocalRecords = () => {
  const unfiltered: PlaylistRecords = JSON.parse(
    localStorage.getItem("ranyouRecords") ?? "{}",
  );
  const filtered: PlaylistRecords = {};
  Object.entries(unfiltered)
    .filter(([, v]) => isPlaylistRecord(v))
    .forEach(([k, v]) => (filtered[k] = v));
  for (const key in filtered) {
    filtered[key].published_at = new Date(filtered[key].published_at);
  }
  writeLocalRecords(filtered);
  return filtered;
};

export const writeLocalRecords = (records: PlaylistRecords) => {
  localStorage.setItem("ranyouRecords", JSON.stringify(records));
};

export const fetchRecords = async (
  playlistId: string,
  opts?: RequestInit,
): Promise<PlaylistRecord | Response> => {
  const res = await fetch("/api/playlist-record/" + playlistId, opts);
  if (res.status === 200) {
    const json: PlaylistRecord = await res.json();
    json.published_at = new Date(json.published_at);
    return json;
  }
  return res;
};

export const fetchItems = async (
  playlistId: string,
  opts?: RequestInit,
): Promise<PlaylistItem[]> => {
  const items = await db.items
    .where("playlist_id")
    .equals(playlistId)
    .toArray();
  if (items.length !== 0) {
    return items;
  }
  const res = await fetch("/api/playlist-items/" + playlistId, opts);
  const resItems = await res.json();
  if (Array.isArray(resItems)) await db.items.bulkAdd(resItems);
  return resItems;
};
