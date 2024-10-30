use std::collections::{HashMap, HashSet};
use std::sync::Arc;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::errors::ResponseResult;

use super::PlaylistItem;

#[derive(Debug, Clone)]
pub struct YouTube {
    client: reqwest::Client,
    key: Arc<str>,
}

// PL8rnKz8DLviY61M2ehtoxoLw8ThC3a5ar

impl YouTube {
    pub fn new(client: reqwest::Client, key: String) -> Self {
        let key = key.into();
        Self { client, key }
    }
    pub async fn get_items(&self, id: &str) -> ResponseResult<HashSet<PlaylistItem>> {
        Ok(self
            .get_all(id)
            .await?
            .into_iter()
            .flat_map(map_res)
            .collect())
    }

    async fn get_all(&self, id: &str) -> ResponseResult<Vec<ApiResponse>> {
        let mut lists = Vec::new();
        let mut res = self.get(id, None).await?;
        while let Some(next) = res.next_page_token.clone() {
            lists.push(res);
            res = self.get(id, Some(&next)).await?;
        }
        Ok(lists)
    }

    async fn get(&self, id: &str, token: Option<&str>) -> ResponseResult<ApiResponse> {
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

fn map_res(res: ApiResponse) -> impl Iterator<Item = PlaylistItem> {
    res.items
        .into_iter()
        .flatten()
        .into_iter()
        .filter_map(|pi| {
            if pi.status?.privacy_status?.as_str() != "public" {
                return None;
            }
            let snippet = pi.snippet?;
            let content_details = pi.content_details?;
            Some(PlaylistItem {
                added_at: snippet.published_at?,
                title: snippet.title?,
                description: snippet.description?,
                channel_title: snippet.channel_title?,
                channel_id: snippet.channel_id?,
                position: snippet.position? as i32,
                video_id: content_details.video_id?,
                note: content_details.note.unwrap_or_default(),
                published_at: content_details.video_published_at?,
            })
        })
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ApiResponse {
    kind: Option<String>, // fixed string "youtube#playlistItemListResponse"
    etag: Option<String>,
    next_page_token: Option<String>,
    prev_page_token: Option<String>,
    page_info: Option<PageInfo>,
    items: Option<Vec<ApiItem>>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PageInfo {
    total_results: Option<i32>,
    results_per_page: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ApiItem {
    kind: Option<String>, // fixed string "youtube#playlistItem"
    etag: Option<String>,
    id: Option<String>,
    snippet: Option<Snippet>,
    content_details: Option<ContentDetails>,
    status: Option<Status>,
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
