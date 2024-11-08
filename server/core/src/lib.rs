//! The main library
#![deny(
    // clippy::cargo,
    clippy::complexity,
    clippy::correctness,
    clippy::nursery,
    clippy::pedantic,
    clippy::perf,
    // clippy::restriction,
    clippy::style,
    clippy::suspicious,
    clippy::all,
    rustdoc::all,

    future_incompatible,
    rust_2024_compatibility,
    nonstandard_style,
    // warnings
)]
#![allow(
    clippy::single_match_else,
    clippy::missing_errors_doc,
//     clippy::cargo_common_metadata,
//     clippy::missing_docs_in_private_items,
//     clippy::blanket_clippy_restriction_lints,
//     clippy::implicit_return,
//     clippy::dbg_macro
)]
pub mod database;
pub mod errors;
pub mod model;
pub mod util;
pub mod youtube;

use std::sync::Arc;

use axum::{
    extract::{Path, State},
    routing::get,
    Json, Router,
};
use dashmap::DashMap;
use derive_more::derive::From;
use serde::Serialize;
use tokio::sync::watch;
use tower_http::compression::CompressionLayer;
#[allow(unused)]
use tracing::{error, info};

use self::{
    database::Database,
    errors::{ResponseError, ResponseResult},
    model::{PlaylistItem, PlaylistRecord},
    youtube::YouTube,
};

pub use bb8_postgres::tokio_postgres::Config;

// TODO: youtube single video playlist analysis(from description)

// TODO: work on client

// TODO: connect client & server

// TODO: consider wrapping context with arc from now on,
// easing async constraints on members

pub struct Context {
    youtube: YouTube,
    database: Database,
    loading: DashMap<String, Loading>,
}

#[derive(Debug)]
enum Loading {
    Items(watch::Receiver<Arc<Vec<PlaylistItem>>>),
}

impl Loading {
    fn items(&self) -> Option<watch::Receiver<Arc<Vec<PlaylistItem>>>> {
        match self {
            Loading::Items(arc) => Some(arc.to_owned()),
        }
    }
}

impl Context {
    /// Creates a new context,
    ///
    /// # Errors
    ///
    /// DB table creation failure
    pub async fn new(youtube_api_key: &str, config: Config) -> ResponseResult<Self> {
        let database = Database::new(config)?;
        database.create_tables().await?;
        Ok(Self {
            youtube: YouTube::new(reqwest::Client::new(), youtube_api_key.to_owned()),
            database,
            loading: DashMap::new(),
        })
    }
    async fn load_record(&self, playlist_id: &str) -> ResponseResult<PlaylistRecord> {
        let record = self
            .youtube
            .get_record(&playlist_id)
            .await?
            .into_iter()
            .next()
            .ok_or_else(|| ResponseError::InvalidPlaylist(playlist_id.to_owned()))?;
        self.database.push_record(&record).await?;
        Ok(record)
    }
    async fn load_items(&self, playlist_id: String) -> ResponseResult<Arc<Vec<PlaylistItem>>> {
        let (tx, rx) = watch::channel(Default::default());
        self.loading.insert(playlist_id.clone(), Loading::Items(rx));
        let items = self.youtube.get_items(&playlist_id).await?;
        let items = Arc::new(items);
        self.database.push_items(&playlist_id, &items).await?;
        self.loading.remove(&playlist_id);
        let _ = tx.send(items.clone());
        info!("{items:#?}");
        Ok(items)
    }
}

pub fn router(ctx: Context) -> Router {
    let compression: CompressionLayer = CompressionLayer::new()
        .br(true)
        .deflate(true)
        .gzip(true)
        .zstd(true);
    Router::new()
        .route("/api/playlist-record/:id", get(get_playlist_record))
        .route("/api/playlist-items/:id", get(get_playlist_items))
        .layer(compression)
        .with_state(ctx.into())
}

#[derive(Serialize, From)]
#[serde(untagged)]
enum PlaylistItemsResponse {
    Immediate(Vec<PlaylistItem>),
    Flux(Arc<Vec<PlaylistItem>>),
}

async fn get_playlist_record(
    State(ctx): State<Arc<Context>>,
    Path(playlist_id): Path<String>,
) -> axum::response::Result<Json<PlaylistRecord>> {
    if let Some(record) = ctx.database.update_record(&playlist_id).await? {
        return Ok(Json(record));
    }
    let record = ctx.load_record(&playlist_id).await?;
    tokio::spawn(async move {
        let _ = ctx
            .load_items(playlist_id)
            .await
            .inspect_err(|e| info!("load items failed: {e}"));
    });
    Ok(Json(record))
}

async fn get_playlist_items(
    State(ctx): State<Arc<Context>>,
    Path(playlist_id): Path<String>,
) -> axum::response::Result<Json<PlaylistItemsResponse>> {
    if let Some(mut rec) = ctx
        .loading
        .get(&playlist_id)
        .and_then(|r| r.value().items())
    {
        let _ = rec.changed().await;
        return Ok(Json(rec.borrow().to_owned().into()));
    }
    if ctx.database.get_record(&playlist_id).await?.is_some() {
        return Ok(Json(ctx.database.get_items(&playlist_id).await?.into()));
    }
    ctx.load_record(&playlist_id).await?;
    Ok(Json(ctx.load_items(playlist_id.clone()).await?.into()))
}
