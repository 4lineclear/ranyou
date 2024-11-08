use std::sync::Arc;

use serde::{Deserialize, Serialize};

use crate::{
    errors::ResponseResult,
    model::{PlaylistItem, PlaylistRecord},
};

use playlist_item::PlaylistItem as ApiPlaylistItem;

use videos::Video as ApiVideo;

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

    pub async fn get_items(&self, id: &str) -> ResponseResult<Vec<PlaylistItem>> {
        fn map(
            (pi, v): (ApiResponse<ApiPlaylistItem>, ApiResponse<ApiVideo>),
        ) -> impl Iterator<Item = (PlaylistItem, VideoData)> {
            playlist_item::map_res(pi).zip(videos::map_res(v))
        }
        Ok(self
            .get_all_items(id)
            .await?
            .into_iter()
            .flat_map(map)
            .map(|(mut pi, v)| {
                pi.duration = v.duration_ms as i64;
                pi
            })
            .collect())
    }

    async fn get_all_items(
        &self,
        id: &str,
    ) -> ResponseResult<Vec<(ApiResponse<ApiPlaylistItem>, ApiResponse<videos::Video>)>> {
        let mut lists = Vec::new();
        let mut token = None;
        loop {
            // TODO: rewrite this so it may run in parallel with the previous items
            let items = self.get_items_page(id, token.as_deref()).await?;
            let data = self.get_video_page(&items.ids()).await?;
            token = items.next_page_token.clone();
            lists.push((items, data));
            if token.is_none() {
                break;
            }
        }
        Ok(lists)
    }

    async fn get_items_page(
        &self,
        id: &str,
        token: Option<&str>,
    ) -> ResponseResult<ApiResponse<ApiPlaylistItem>> {
        let key = &self.key;
        let url = format!(
            "https://www.googleapis.com/youtube/v3/playlistItems?\
            part=contentDetails&\
            part=id&\
            part=snippet&\
            part=status&\
            playlistId={id}&\
            maxResults=50&\
            key={key}&\
            pageToken={}",
            token.unwrap_or_default()
        );
        Ok(self
            .client
            .get(url)
            .header("Accept", "application/json")
            .send()
            .await?
            .json()
            .await?)
    }

    async fn get_video_page(&self, videos_ids: &[&str]) -> ResponseResult<ApiResponse<ApiVideo>> {
        debug_assert!(videos_ids.len() <= 50);
        let key = &self.key;
        let mut url = format!(
            "https://www.googleapis.com/youtube/v3/videos?\
            part=fileDetails&\
            maxResults=50&\
            key={key}"
        );
        videos_ids.iter().for_each(|id| {
            url.push_str("&id=");
            url.push_str(id);
        });
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

struct VideoData {
    duration_ms: u64,
}

mod playlist_item {
    use std::{collections::HashMap, str::FromStr};

    use chrono::{DateTime, Utc};
    use serde::{Deserialize, Serialize};

    use super::ApiResponse;

    pub(super) fn map_res(
        res: ApiResponse<PlaylistItem>,
    ) -> impl Iterator<Item = super::PlaylistItem> {
        res.items.into_iter().flatten().filter_map(|pi| {
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
                duration: match content_details.end_at.as_deref().map(i64::from_str) {
                    Some(Ok(seconds)) => seconds * 1000,
                    _ => 0,
                },
                note: content_details.note.unwrap_or_default(),
                published_at: content_details.video_published_at?,
            })
        })
    }

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

    impl ApiResponse<PlaylistItem> {
        pub(super) fn ids(&self) -> Vec<&str> {
            self.items
                .iter()
                .flatten()
                .take(50)
                .filter_map(|pi| pi.content_details.as_ref()?.video_id.as_deref())
                .collect()
        }
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
    pub(super) struct PlaylistRecord {
        kind: Option<String>,
        etag: Option<String>,
        id: Option<String>,
        snippet: Option<Snippet>,
        status: Option<Status>,
        content_details: Option<ContentDetails>,
        player: Option<Player>,
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

mod videos {

    use serde::{Deserialize, Serialize};
    use std::collections::HashMap;

    use super::{ApiResponse, VideoData};

    pub(super) fn map_res(res: ApiResponse<Video>) -> impl Iterator<Item = super::VideoData> {
        res.items.into_iter().flatten().filter_map(|v| {
            Some(VideoData {
                duration_ms: v.file_details?.duration_ms?,
            })
        })
    }

    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    pub(super) struct Video {
        kind: Option<String>,
        etag: Option<String>,
        id: Option<String>,
        snippet: Option<Snippet>,
        content_details: Option<ContentDetails>,
        status: Option<Status>,
        statistics: Option<Statistics>,
        paid_product_placement_details: Option<PaidProductPlacementDetails>,
        player: Option<Player>,
        topic_details: Option<TopicDetails>,
        recording_details: Option<RecordingDetails>,
        file_details: Option<FileDetails>,
        processing_details: Option<ProcessingDetails>,
        suggestions: Option<Suggestions>,
        live_streaming_details: Option<LiveStreamingDetails>,
        localizations: Option<HashMap<String, Localization>>,
    }

    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct Snippet {
        published_at: Option<String>,
        channel_id: Option<String>,
        title: Option<String>,
        description: Option<String>,
        thumbnails: Option<HashMap<String, Thumbnail>>,
        channel_title: Option<String>,
        tags: Option<Vec<String>>,
        category_id: Option<String>,
        live_broadcast_content: Option<String>,
        default_language: Option<String>,
        localized: Option<Localized>,
        default_audio_language: Option<String>,
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
    struct Localized {
        title: Option<String>,
        description: Option<String>,
    }

    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct ContentDetails {
        duration: Option<String>,
        dimension: Option<String>,
        definition: Option<String>,
        caption: Option<String>,
        licensed_content: Option<bool>,
        region_restriction: Option<RegionRestriction>,
        content_rating: Option<ContentRating>,
        projection: Option<String>,
        has_custom_thumbnail: Option<bool>,
    }

    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct RegionRestriction {
        allowed: Option<Vec<String>>,
        blocked: Option<Vec<String>>,
    }

    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct ContentRating {
        acb_rating: Option<String>,
        agcom_rating: Option<String>,
        anatel_rating: Option<String>,
        // Add other fields as needed
        yt_rating: Option<String>,
    }

    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct Status {
        upload_status: Option<String>,
        failure_reason: Option<String>,
        rejection_reason: Option<String>,
        privacy_status: Option<String>,
        publish_at: Option<String>,
        license: Option<String>,
        embeddable: Option<bool>,
        public_stats_viewable: Option<bool>,
        made_for_kids: Option<bool>,
        self_declared_made_for_kids: Option<bool>,
        contains_synthetic_media: Option<bool>,
    }

    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct Statistics {
        view_count: Option<String>,
        like_count: Option<String>,
        dislike_count: Option<String>,
        favorite_count: Option<String>,
        comment_count: Option<String>,
    }

    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct PaidProductPlacementDetails {
        has_paid_product_placement: Option<bool>,
    }

    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct Player {
        embed_html: Option<String>,
        embed_height: Option<u64>,
        embed_width: Option<u64>,
    }

    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct TopicDetails {
        topic_ids: Option<Vec<String>>,
        relevant_topic_ids: Option<Vec<String>>,
        topic_categories: Option<Vec<String>>,
    }

    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct RecordingDetails {
        recording_date: Option<String>,
    }

    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct FileDetails {
        file_name: Option<String>,
        file_size: Option<u64>,
        file_type: Option<String>,
        container: Option<String>,
        video_streams: Option<Vec<VideoStream>>,
        audio_streams: Option<Vec<AudioStream>>,
        duration_ms: Option<u64>,
        bitrate_bps: Option<u64>,
        creation_time: Option<String>,
    }

    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct VideoStream {
        width_pixels: Option<u32>,
        height_pixels: Option<u32>,
        frame_rate_fps: Option<f64>,
        aspect_ratio: Option<f64>,
        codec: Option<String>,
        bitrate_bps: Option<u64>,
        rotation: Option<String>,
        vendor: Option<String>,
    }

    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct AudioStream {
        channel_count: Option<u32>,
        codec: Option<String>,
        bitrate_bps: Option<u64>,
        vendor: Option<String>,
    }

    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct ProcessingDetails {
        processing_status: Option<String>,
        processing_progress: Option<ProcessingProgress>,
        processing_failure_reason: Option<String>,
        file_details_availability: Option<String>,
        processing_issues_availability: Option<String>,
        tag_suggestions_availability: Option<String>,
        editor_suggestions_availability: Option<String>,
        thumbnails_availability: Option<String>,
    }

    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct ProcessingProgress {
        parts_total: Option<u64>,
        parts_processed: Option<u64>,
        time_left_ms: Option<u64>,
    }

    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct Suggestions {
        processing_errors: Option<Vec<String>>,
        processing_warnings: Option<Vec<String>>,
        processing_hints: Option<Vec<String>>,
        tag_suggestions: Option<Vec<TagSuggestion>>,
        editor_suggestions: Option<Vec<String>>,
    }

    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct TagSuggestion {
        tag: Option<String>,
        category_restricts: Option<Vec<String>>,
    }

    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct LiveStreamingDetails {
        actual_start_time: Option<String>,
        actual_end_time: Option<String>,
        scheduled_start_time: Option<String>,
        scheduled_end_time: Option<String>,
        concurrent_viewers: Option<u64>,
        active_live_chat_id: Option<String>,
    }

    #[derive(Debug, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct Localization {
        title: Option<String>,
        description: Option<String>,
    }
}
