//! The main library
//! NOTE: see https://github.com/awslabs/aws-lambda-rust-runtime/tree/main/examples

pub mod errors;
pub mod youtube;

use axum::{
    extract::{Query, State},
    response::Html,
    routing::get,
    Json, Router,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use self::youtube::YouTube;

#[derive(Clone)]
pub struct Context {
    youtube: YouTube,
}

impl Context {
    pub async fn new(youtube_api_key: &str) -> Self {
        let client = reqwest::Client::new();
        let youtube = YouTube::new(client, youtube_api_key.to_owned());
        Self { youtube }
    }
}

#[derive(Debug, Clone, Deserialize)]
struct PlaylistQuery {
    playlist_id: String,
}

#[derive(Debug, Clone, Serialize)]
struct PlaylistResponse {
    items: Vec<PlaylistItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlaylistItem {
    // playlist-video id
    id: String,
    // The date this item was added to the playlist
    added_at: DateTime<Utc>,
    title: String,
    description: String,
    channel_title: String,
    channel_id: String,
    position: u32,
    video_id: String,
    note: String,
    // The date this item was added to youtube
    published_at: DateTime<Utc>,
}
pub fn router(ctx: Context) -> Router {
    Router::new()
        .route("/", get(|| async { Html("hello, world!") }))
        .route("/api/", get(get_playlist))
        .with_state(ctx)
}

async fn get_playlist(
    State(ctx): State<Context>,
    Query(query): Query<PlaylistQuery>,
) -> axum::response::Result<Json<PlaylistResponse>> {
    Ok(Json(PlaylistResponse {
        items: ctx.youtube.get_items(query.playlist_id).await?,
    }))
}
