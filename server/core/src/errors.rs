use axum::http::StatusCode;
use axum::response::IntoResponse;
use thiserror::Error;
use tracing::error;

pub type ResponseResult<T> = Result<T, ResponseError>;

#[derive(Error, Debug)]
pub enum ResponseError {
    #[error("reqwest error: {0}")]
    Reqwest(#[from] reqwest::Error),
    #[error("libsql error: {0}")]
    Postgres(#[from] bb8_postgres::tokio_postgres::Error),
    #[error("deserialize error: {0}")]
    Deserialize(#[from] serde::de::value::Error),
}

impl IntoResponse for ResponseError {
    fn into_response(self) -> axum::response::Response {
        let body = self.to_string();
        let code = StatusCode::INTERNAL_SERVER_ERROR;
        error!("{body}");
        (code, body).into_response()
    }
}
