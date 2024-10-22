export interface ApiItemPage {
  kind: 'youtube#playlistItemListResponse';
  etag: string;
  nextPageToken: string | undefined;
  prevPageToken: string | undefined;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: ApiItem[];
}

/**
 * Based off [here](https://developers.google.com/youtube/v3/docs/playlistItems#resource)
 * */
export interface ApiItem {
  kind: 'youtube#playlistItem';
  etag: string;
  id: string;
  snippet: {
    publishedAt: string; // ISO8601
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      [key: string]: {
        url: string;
        width: number;
        height: number;
      };
    };
    channelTitle: string;
    videoOwnerChannelTitle: string;
    videoOwnerChannelId: string;
    playlistId: string;
    position: number;
    resourceId: {
      kind: string;
      videoId: string;
    };
  };
  contentDetails: {
    videoId: string;
    startAt: string;
    endAt: string;
    note: string;
    videoPublishedAt: string; // ISO8601
  };
  status: {
    privacyStatus: string;
  };
}

/**
 * Simplified version of ApiItem used for usage
 */
export interface PlaylistItem {
  // playlist-video id
  id: string;
  // The date this item was added to the playlist
  publishedAt: Date;
  title: string;
  description: string;
  videoOwnerChannelTitle: string;
  videoOwnerChannelId: string;
  position: number;
  videoId: string;
  note: string;
  // The date this item was added to youtube
  videoPublishedAt: Date;
}
