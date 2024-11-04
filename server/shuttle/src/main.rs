use std::str::FromStr;

use ranyou_core::errors::ResponseError::{self};
use ranyou_core::Config;
use shuttle_service::SecretStore;

#[shuttle_runtime::main]
async fn main(
    #[shuttle_shared_db::Postgres(local_uri = "{secrets.LOCAL_DB_URL}")] conn_str: String,
    #[shuttle_runtime::Secrets] secrets: SecretStore,
) -> shuttle_axum::ShuttleAxum {
    // TODO:: make this less ugly.
    let key = secrets
        .get("YOUTUBE_API_KEY")
        .expect("couldn't find youtube api key");
    let config = Config::from_str(&conn_str)
        .map_err(ResponseError::from)
        .map_err(map_err)?;
    let ctx = ranyou_core::Context::new(&key, config)
        .await
        .map_err(map_err)?;
    let router = ranyou_core::router(ctx);
    #[cfg(debug_assertions)]
    {
        Ok(router.into())
    }
    #[cfg(not(debug_assertions))]
    {
        Ok(router
            .nest_service("/", tower_http::services::ServeDir::new("../build"))
            .into())
    }
}

fn map_err(e: ResponseError) -> shuttle_service::Error {
    shuttle_service::Error::Custom(e.into())
}
