import Dexie, { type EntityTable } from "dexie";
import { PlaylistItem } from "./youtube";

// TODO: consider moving records to db

const db = new Dexie("RanyouDB") as Dexie & {
  items: EntityTable<PlaylistItem, "video_id">;
};

db.version(1).stores({
  items: "++id, video_id, playlist_id",
});

export { db };
