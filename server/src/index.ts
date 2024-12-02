import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { HTTPException } from "hono/http-exception";
import { compress } from "hono-compress";
import { ApiPlaylist, getPlaylistItems, getPlaylistRecord } from "./youtube";
import { item, record, setIntevalStyle } from "./database";
import { isPlaylistRecord } from "ranyou-shared/src";

type Nullish = null | undefined;
const isNullish = (target: unknown): target is Nullish => target == null;

const recordResponseBody = (record: ApiPlaylist): any | null => {
  const res = {
    playlist_id: record.id,
    published_at: new Date(record.snippet?.publishedAt ?? ""),
    channel_id: record.snippet?.channelId,
    channel_title: record.snippet?.channelTitle,
    title: record.snippet?.title,
    description: record.snippet?.description ?? "",
    privacy_status: record.status?.privacyStatus,
    thumbnail:
      record.snippet?.thumbnails?.standard?.url ??
      record.snippet?.thumbnails?.medium?.url ??
      "",
    playlist_length: record.contentDetails?.itemCount ?? undefined,
  };
  return Object.values(res).some(isNullish) ? null : res;
};

const api = new Hono();

api.get("/playlist-record/:playlist-id", async (c) => {
  const playlistId = c.req.param("playlist-id");
  const dbRecord = await record.select(playlistId);
  if (dbRecord.length) return c.body(JSON.stringify(dbRecord[0]));
  const recordResponse = await getPlaylistRecord(playlistId);
  if (typeof recordResponse == "number")
    throw new HTTPException(500, { message: "Internal Server Error" });
  if (!recordResponse.items || !recordResponse.items.length)
    throw new HTTPException(400, { message: "Playlist Not Found" });

  const res = recordResponseBody(recordResponse.items[0]);
  if (!isPlaylistRecord(res))
    throw new HTTPException(400, { message: "Playlist Not Found" });
  await record.insert(res);

  c.header("Content-Type", "application/json");
  return c.body(JSON.stringify(res));
});

api.get("/playlist-items/:playlist-id", async (c) => {
  const playlistId = c.req.param("playlist-id");
  c.header("Content-Type", "application/json");

  const dbItems = await item.select(playlistId);
  if (dbItems.length !== 0) {
    dbItems.forEach((i) => (i.playlist_id = undefined));
    return c.body(JSON.stringify(dbItems));
  }

  const items = await getPlaylistItems(playlistId);
  const body = JSON.stringify(items);
  const db = items.map((i) => ({ ...i, playlist_id: playlistId }));
  console.log(db);
  item.insert(db);

  return c.body(body);
});

const app = new Hono();

app.use(compress());

app.route("/api", api);
app
  .use(
    "*",
    serveStatic({
      root: "build",
    }),
  )
  .use(
    "*",
    serveStatic({
      path: "index.html",
      root: "build",
    }),
  );

setIntevalStyle().finally(console.info);
record.create().finally(console.info);
item.create().finally(console.info);

export default {
  port: 8000,
  ...app,
};
