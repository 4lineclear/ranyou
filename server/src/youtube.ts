import { youtube, youtube_v3 } from "@googleapis/youtube";
import { PlaylistItem } from "ranyou-shared/src";

const youtubeApiKey = process.env["YOUTUBE_API_KEY"]!;

const yt = youtube("v3");

export type ApiPlaylist = youtube_v3.Schema$Playlist;
export type ApiPlaylistResponse = youtube_v3.Schema$PlaylistListResponse;
export type ApiPlaylistItemPage = youtube_v3.Schema$PlaylistItemListResponse;
export type ApiPlaylistItem = youtube_v3.Schema$PlaylistItem;
export type ApiVideoPage = youtube_v3.Schema$VideoListResponse;

export const getPlaylistRecord = async (
  playlistId: string,
): Promise<ApiPlaylistResponse | number> => {
  const res = await yt.playlists.list({
    part: ["contentDetails", "id", "snippet", "status"],
    maxResults: 50,
    id: [playlistId],
    key: youtubeApiKey,
  });
  return res.status === 200 ? await res.data : res.status;
};

const mapItem = (item: ApiPlaylistItem) => {
  const res: PlaylistItem = {
    video_id: item.contentDetails?.videoId ?? "",
    title: item.snippet?.title ?? "",
    description: item.snippet?.description ?? "",
    note: item.contentDetails?.note ?? "",
    position: item.snippet?.position ?? -1,
    // NOTE: channel info being null usually means private video
    channel_title: item.snippet?.videoOwnerChannelTitle ?? "",
    channel_id: item.snippet?.videoOwnerChannelId ?? "",
    duration: item.contentDetails?.endAt ?? "PT0H0M0S",
    added_at: new Date(item.snippet?.publishedAt ?? 0),
    published_at: new Date(item.contentDetails?.videoPublishedAt ?? 0),
  };
  return res;
};

export const getPlaylistItems = async (
  playlistId: string,
): Promise<PlaylistItem[]> => {
  const items: PlaylistItem[] = [];
  const videoPages = [];
  let res;
  do {
    res = await getPlaylistItemPage(
      playlistId,
      res?.nextPageToken || undefined,
    );
    if (typeof res === "number" || !res.items) break;
    items.push(...res.items.map(mapItem));
    videoPages.push(
      getVideoPage(
        res.items
          .map((s) => s.contentDetails?.videoId)
          .filter((s) => s) as string[],
      ),
    );
  } while (res.nextPageToken);

  const itemMap: Record<string, number> = {};
  items.forEach((p, i) => (itemMap[p.video_id] = i));
  for (const page of await Promise.all(videoPages))
    for (const sv of (page as ApiVideoPage).items ?? [])
      if (sv.id && sv.contentDetails?.duration && sv.id in itemMap)
        items[itemMap[sv.id]].duration = sv.contentDetails.duration;

  return items;
};

export const getPlaylistItemPage = async (
  playlistId: string,
  pageToken?: string,
): Promise<ApiPlaylistItemPage | number> => {
  const res = await yt.playlistItems.list({
    part: ["contentDetails", "id", "snippet", "status"],
    maxResults: 50,
    playlistId: playlistId,
    pageToken: pageToken,
    key: youtubeApiKey,
  });
  return res.status === 200 ? res.data : res.status;
};

export const getVideoPage = async (
  ids: string[],
  pageToken?: string,
): Promise<ApiVideoPage | number> => {
  const res = await yt.videos.list({
    part: ["contentDetails", "id"],
    maxResults: 50,
    id: ids,
    pageToken: pageToken,
    key: youtubeApiKey,
  });
  return res.status === 200 ? res.data : res.status;
};
