//! The main library
//! NOTE: see https://github.com/awslabs/aws-lambda-rust-runtime/tree/main/examples

pub mod database;
pub mod errors;

use chrono::{DateTime, Utc};
use google_youtube3::api::PlaylistItemListResponse;
use google_youtube3::{hyper_rustls, hyper_util, YouTube};
use lambda_http::{IntoResponse, Request, RequestExt};

use errors::ResponseError;

type YTClient =
    YouTube<hyper_rustls::HttpsConnector<hyper_util::client::legacy::connect::HttpConnector>>;

#[derive(Clone)]
pub struct Context {
    pub db: aws_sdk_dynamodb::Client,
    pub lambda: aws_sdk_lambda::Client,
    pub youtube: YTClient,
}

impl Context {
    async fn get_playlist_items(
        &self,
        playlist_id: &str,
        next: Option<String>,
    ) -> Result<PlaylistItemListResponse, ResponseError> {
        let parts = ["contentDetails", "id", "snippet", "status"]
            .map(str::to_owned)
            .to_vec();
        let mut list = self
            .youtube
            .playlist_items()
            .list(&parts)
            .playlist_id(playlist_id);
        if let Some(next) = next {
            list = list.page_token(&next);
        }
        Ok(list.max_results(50).doit().await?.1)
    }
}

#[derive(Debug, Clone)]
#[allow(unused)]
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

// TODO: may need to split this into another lambda, as the limit may be 50
async fn create_items(
    ctx: &Context,
    playlist_id: &str,
) -> Result<Vec<PlaylistItemListResponse>, ResponseError> {
    let mut lists = Vec::new();
    let mut res = ctx.get_playlist_items(playlist_id, None).await?;
    while let Some(next) = res.next_page_token.clone() {
        lists.push(res);
        res = ctx.get_playlist_items(playlist_id, Some(next)).await?;
    }
    Ok(lists)
}

fn map_res(res: PlaylistItemListResponse) -> impl Iterator<Item = PlaylistItem> {
    res.items
        .into_iter()
        .flat_map(|items| items.into_iter())
        .filter_map(|pi| {
            if pi.status?.privacy_status?.as_str() != "public" {
                return None;
            }
            let snippet = pi.snippet?;
            let content_details = pi.content_details?;
            Some(PlaylistItem {
                id: pi.id?,
                added_at: snippet.published_at?,
                title: snippet.title?,
                description: snippet.description?,
                channel_title: snippet.channel_title?,
                channel_id: snippet.channel_id?,
                position: snippet.position?,
                video_id: content_details.video_id?,
                note: content_details.note?,
                published_at: content_details.video_published_at?,
            })
        })
}

pub async fn handler(event: Request, ctx: &Context) -> Result<impl IntoResponse, ResponseError> {
    let playlist_id = event
        .query_string_parameters_ref()
        .and_then(|params| params.first("playlist-id"))
        .ok_or(ResponseError::MissingPlaylistId)?;
    let items: Vec<PlaylistItem> = create_items(ctx, playlist_id)
        .await?
        .into_iter()
        .flat_map(map_res)
        .collect();
    println!("{items:#?}");
    Ok(format!("ID: {playlist_id}!"))
}

pub async fn setup_youtube() -> YTClient {
    rustls::crypto::aws_lc_rs::default_provider()
        .install_default()
        .expect("unable to install provider");
    let connector = hyper_rustls::HttpsConnectorBuilder::new()
        .with_native_roots()
        .expect("no native CA certificates found")
        .https_or_http()
        .enable_http1()
        .build();
    google_youtube3::YouTube::new(
        hyper_util::client::legacy::Client::builder(hyper_util::rt::TokioExecutor::new())
            .build(connector),
        env!("YOUTUBE_API_KEY").to_owned(),
    )
}
