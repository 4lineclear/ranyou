use ranyou_core::Context;
use tokio::net::TcpListener;
use tracing::info;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt().init();
    let youtube_api_key = std::env::var("YOUTUBE_API_KEY").expect("youtube api key not set");
    let port = std::env::var("PORT").unwrap_or("8000".into());
    let addr = format!("0.0.0.0:{port}");
    info!("starting server on {addr}");
    axum::serve(
        TcpListener::bind(addr).await.unwrap(),
        ranyou_core::router(Context::new(&youtube_api_key).await),
    )
    .await
    .expect("Axum Server Error");
    info!("stopping server");
}
