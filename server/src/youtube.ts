import { fetch } from "bun";

const youtubeApiKey = process.env["YOUTUBE_API_KEY"]!;

export const getPlaylistRecord = async (
  playlistId: string,
): Promise<
  GoogleApiYouTubePageInfo<GoogleApiYouTubePlaylistResource> | Response
> => {
  const url = `\
https://www.googleapis.com/youtube/v3/playlists?\
part=contentDetails&\
part=id&\
part=snippet&\
part=status&\
id=${playlistId}&\
maxResults=50&\
key=${youtubeApiKey}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  return res.status === 200 ? await res.json() : res;
};
