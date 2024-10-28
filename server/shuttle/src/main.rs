use libsql::Database;
use shuttle_service::SecretStore;

pub mod turso;

#[shuttle_runtime::main]
async fn main(
    #[turso::Turso(
        addr = "libsql://ranyou-playlist-meta-4lineclear.turso.io",
        token = "{secrets.TURSO_API_KEY}"
    )]
    _client: Database,
    #[shuttle_runtime::Secrets] secrets: SecretStore,
) -> shuttle_axum::ShuttleAxum {
    Ok(ranyou_core::router(
        ranyou_core::Context::new(
            &secrets
                .get("YOUTUBE_API_KEY")
                .expect("couldn't find youtube api key"),
        )
        .await,
    )
    .into())
}
