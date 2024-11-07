use std::sync::Arc;

use serde::{Deserialize, Serialize};

use crate::{
    errors::ResponseResult,
    model::{PlaylistItem, PlaylistRecord},
};

use playlist_item::PlaylistItem as ApiPlaylistItem;
use playlist_record::PlaylistRecord as ApiPlaylistRecord;

// TODO: map res trait?

#[derive(Debug, Clone)]
pub struct YouTube {
    client: reqwest::Client,
    key: Arc<str>,
}

impl YouTube {
    pub fn new(client: reqwest::Client, key: String) -> Self {
        let key = key.into();
        Self { client, key }
    }
    pub async fn get_record(&self, id: &str) -> ResponseResult<Vec<PlaylistRecord>> {
        let key = &self.key;
        let url = format!(
            "https://www.googleapis.com/youtube/v3/playlists?\
            part=contentDetails&\
            part=id&\
            part=snippet&\
            part=status&\
            id={id}&\
            maxResults=50&\
            key={key}"
        );
        Ok(self
            .client
            .get(url)
            .header("Accept", "application/json")
            .send()
            .await?
            .json()
            .await
            .map(playlist_record::map_res)?
            .collect())
    }

    pub async fn load_items_aot(&self, id: &str) -> ResponseResult<Vec<PlaylistItem>> {
        Ok(self
            .get_all(id)
            .await?
            .into_iter()
            .flat_map(playlist_item::map_res)
            .collect())
    }

    pub async fn get_items(&self, id: &str) -> ResponseResult<Vec<PlaylistItem>> {
        Ok(self
            .get_all(id)
            .await?
            .into_iter()
            .flat_map(playlist_item::map_res)
            .collect())
    }

    async fn get_all(&self, id: &str) -> ResponseResult<Vec<ApiResponse<ApiPlaylistItem>>> {
        let mut lists = Vec::new();
        let mut res = self.get(id, None).await?;
        while let Some(next) = res.next_page_token.clone() {
            lists.push(res);
            res = self.get(id, Some(&next)).await?;
        }
        Ok(lists)
    }

    async fn get(
        &self,
        id: &str,
        token: Option<&str>,
    ) -> ResponseResult<ApiResponse<ApiPlaylistItem>> {
        let key = &self.key;
        let mut url = format!(
            "https://www.googleapis.com/youtube/v3/playlistItems?\
            part=contentDetails&\
            part=id&\
            part=snippet&\
            part=status&\
            playlistId={id}&\
            maxResults=50&\
            key={key}"
        );
        if let Some(token) = token {
            url.push_str("&pageToken=");
            url.push_str(token);
        }
        Ok(self
            .client
            .get(url)
            .header("Accept", "application/json")
            .send()
            .await?
            .json()
            .await?)
    }
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ApiResponse<Item> {
    kind: Option<String>, // fixed string "youtube#playlistItemListResponse"
    etag: Option<String>,
    next_page_token: Option<String>,
    prev_page_token: Option<String>,
    page_info: Option<PageInfo>,
    items: Option<Vec<Item>>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PageInfo {
    total_results: Option<i32>,
    results_per_page: Option<i32>,
}

mod playlist_item {
    use std::collections::HashMap;

    use chrono::{DateTime, Utc};
    use serde::{Deserialize, Serialize};

    use super::ApiResponse;

    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]

    pub(super) struct PlaylistItem {
        kind: Option<String>, // fixed string "youtube#playlistItem"
        etag: Option<String>,
        id: Option<String>,
        snippet: Option<Snippet>,
        content_details: Option<ContentDetails>,
        status: Option<Status>,
    }

    pub(super) fn map_res(
        res: ApiResponse<PlaylistItem>,
    ) -> impl Iterator<Item = super::PlaylistItem> {
        res.items
            .into_iter()
            .flatten()
            .into_iter()
            .filter_map(|pi| {
                let snippet = pi.snippet?;
                let content_details = pi.content_details?;
                Some(super::PlaylistItem {
                    added_at: snippet.published_at?,
                    title: snippet.title?,
                    description: snippet.description?,
                    channel_title: snippet.video_owner_channel_id?,
                    channel_id: snippet.video_owner_channel_title?,
                    position: snippet.position? as i32,
                    video_id: content_details.video_id?,
                    note: content_details.note.unwrap_or_default(),
                    published_at: content_details.video_published_at?,
                })
            })
    }

    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct Snippet {
        /// datetime as ISO 8601 string
        published_at: Option<DateTime<Utc>>,
        channel_id: Option<String>,
        title: Option<String>,
        description: Option<String>,
        thumbnails: Option<HashMap<String, Thumbnail>>,
        channel_title: Option<String>,
        video_owner_channel_title: Option<String>,
        video_owner_channel_id: Option<String>,
        playlist_id: Option<String>,
        position: Option<u32>,
        resource_id: Option<ResourceId>,
    }

    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct Thumbnail {
        url: Option<String>,
        width: Option<u32>,
        height: Option<u32>,
    }

    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct ResourceId {
        kind: Option<String>,
        video_id: Option<String>,
    }

    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct ContentDetails {
        video_id: Option<String>,
        /// datetime as ISO 8601 string
        video_published_at: Option<DateTime<Utc>>,
        start_at: Option<String>,
        end_at: Option<String>,
        note: Option<String>,
    }

    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct Status {
        privacy_status: Option<String>,
    }
}

mod playlist_record {
    use std::collections::HashMap;

    use chrono::{DateTime, Utc};
    use serde::{Deserialize, Serialize};

    use super::ApiResponse;

    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    pub(super) struct PlaylistRecord {
        kind: Option<String>,
        etag: Option<String>,
        id: Option<String>,
        snippet: Option<Snippet>,
        status: Option<Status>,
        content_details: Option<ContentDetails>,
        player: Option<Player>,
    }

    pub(super) fn map_res(
        res: ApiResponse<PlaylistRecord>,
    ) -> impl Iterator<Item = super::PlaylistRecord> {
        res.items
            .into_iter()
            .flatten()
            .into_iter()
            .filter_map(|pr| {
                let snippet = pr.snippet?;
                let content_details = pr.content_details?;
                let thumbnail = snippet
                    .thumbnails?
                    .into_iter()
                    .map(|(_, Thumbnail { url, width, height })| {
                        (url, width.unwrap_or_default() * height.unwrap_or_default())
                    })
                    .min_by(|a, b| a.1.cmp(&b.1))
                    .and_then(|(u, _)| u);
                Some(super::PlaylistRecord {
                    playlist_id: pr.id?,
                    published_at: snippet.published_at?,
                    channel_id: snippet.channel_id?,
                    channel_title: snippet.channel_title?,
                    title: snippet.title?,
                    description: snippet.description.unwrap_or_default(),
                    privacy_status: pr.status?.privacy_status?,
                    thumbnail,
                    playlist_length: content_details.item_count? as i32,
                    // dummy value; db will default 1
                    read_count: 0,
                    // dummy value; db time will be used
                    recorded_at: snippet.published_at?,
                })
            })
    }

    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct Thumbnail {
        url: Option<String>,
        width: Option<i32>,
        height: Option<i32>,
    }

    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct Snippet {
        published_at: Option<DateTime<Utc>>,
        channel_id: Option<String>,
        title: Option<String>,
        description: Option<String>,
        channel_title: Option<String>,
        default_language: Option<String>,
        thumbnails: Option<HashMap<String, Thumbnail>>,
    }

    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct Localized {
        title: Option<String>,
        description: Option<String>,
    }

    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct Status {
        privacy_status: Option<String>,
        podcast_status: Option<String>,
    }

    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct ContentDetails {
        item_count: Option<u32>,
    }

    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct Player {
        embed_html: Option<String>,
    }
}
