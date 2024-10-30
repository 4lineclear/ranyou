//! The main library

pub mod database;
pub mod errors;
pub mod model;
pub mod youtube;

use std::{collections::HashSet, sync::Arc};

use axum::{
    extract::{Query, State},
    response::Html,
    routing::get,
    Json, Router,
};
use serde::{Deserialize, Serialize};
use tracing::{error, info};

use self::{database::Database, errors::ResponseResult, model::PlaylistItem, youtube::YouTube};

pub use bb8_postgres::tokio_postgres::Config;

// TODO: work on client

// TODO: connect client & server

#[derive(Clone)]
pub struct Context {
    youtube: YouTube,
    database: Database,
}

impl Context {
    /// Creates a new context,
    ///
    /// # Errors
    ///
    /// DB table creation failure
    pub async fn new(youtube_api_key: &str, config: Config) -> ResponseResult<Self> {
        let client = reqwest::Client::new();
        let youtube = YouTube::new(client, youtube_api_key.to_owned());
        let database = Database::new(config)?;
        database.create_tables().await?;
        Ok(Self { youtube, database })
    }
}

#[derive(Debug, Clone, Deserialize)]
struct PlaylistQuery {
    playlist_id: String,
}

#[derive(Debug, Clone, Serialize)]
struct PlaylistResponse {
    items: Arc<HashSet<PlaylistItem>>,
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
    let id = query.playlist_id.clone();
    info!("playlist query start {id}");
    let count = ctx
        .database
        .push_record(&query.playlist_id)
        .await
        .inspect_err(|e| error!("{e}"))?;
    let items = if count > 1 {
        let items = Arc::new(ctx.database.get_items(&query.playlist_id).await?);
        items
    } else {
        let items = Arc::new(ctx.youtube.get_items(&query.playlist_id).await?);
        let db_items = Arc::clone(&items);
        tokio::spawn(async move {
            match ctx.database.push_items(&query.playlist_id, &db_items).await {
                Ok(()) => info!("db item store succeded"),
                Err(e) => error!("db error store failed: {e}"),
            };
        });
        items
    };
    info!("playlist query end {id}");
    Ok(Json(PlaylistResponse { items }))
}
