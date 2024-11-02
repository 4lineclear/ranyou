use std::str::FromStr;

use ranyou_core::errors::ResponseError::{self};
use ranyou_core::Config;
use shuttle_service::SecretStore;
use tower_http::services::ServeDir;

#[shuttle_runtime::main]
async fn main(
    #[shuttle_shared_db::Postgres(local_uri = "{secrets.LOCAL_DB_URL}")] conn_str: String,
    #[shuttle_runtime::Secrets] secrets: SecretStore,
) -> shuttle_axum::ShuttleAxum {
    Ok(
        #[cfg(debug_assertions)]
        {
            ranyou_core::router(
                ranyou_core::Context::new(
                    &secrets
                        .get("YOUTUBE_API_KEY")
                        .expect("couldn't find youtube api key"),
                    Config::from_str(&conn_str)
                        .map_err(ResponseError::from)
                        .map_err(map_err)?,
                )
                .await
                .map_err(map_err)?,
            )
            .into()
        },
        #[cfg(not(debug_assertions))]
        {
            ranyou_core::router(
                ranyou_core::Context::new(
                    &secrets
                        .get("YOUTUBE_API_KEY")
                        .expect("couldn't find youtube api key"),
                    Config::from_str(&conn_str)
                        .map_err(ResponseError::from)
                        .map_err(map_err)?,
                )
                .await
                .map_err(map_err)?,
            )
            .nest_service("/", ServeDir::new("../build"))
            .into()
        },
    )
}

fn map_err(e: ResponseError) -> shuttle_service::Error {
    shuttle_service::Error::Custom(e.into())
}
