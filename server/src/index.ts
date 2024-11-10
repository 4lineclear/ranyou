import { env, fetch } from "bun";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { getPlaylistRecord } from "./youtube";
import { PlaylistRecord, PlaylistItem } from "ranyou-shared/src/index";

const api = new Hono();

api.get("/playlist-record/:playlist-id", async (c) => {
  const playlistId = c.req.param("playlist-id");
  const recordResponse = await getPlaylistRecord(playlistId);

  if (recordResponse instanceof Response)
    throw new HTTPException(500, { message: "Internal Server Error" });
  if (recordResponse.items.length === 0)
    throw new HTTPException(400, { message: "Playlist Not Found" });

  const record = recordResponse.items[0];

  console.log(record.snippet.publishedAt);

  return c.body(
    JSON.stringify({
      playlist_id: record.id,
      published_at: new Date(record.snippet.publishedAt),
      channel_id: record.snippet.channelId,
      channel_title: record.snippet.channelTitle,
      title: record.snippet.title,
      description: record.snippet.description,
      thumbnail: (
        record.snippet.thumbnails.standard ?? record.snippet.thumbnails.medium
      ).url,
      privacy_status: record.status.privacyStatus,
      playlist_length: record.contentDetails.itemCount,
    } satisfies PlaylistRecord),
  );
});

const app = new Hono();
app.route("/api", api);
app.get(
  "/*",
  serveStatic({
    root: "build",
  }),
);

export default {
  port: 8000,
  ...app,
};
