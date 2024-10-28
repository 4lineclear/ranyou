use axum::http::StatusCode;
use axum::response::IntoResponse;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ResponseError {
    #[error("reqwest error: {0}")]
    Reqwest(#[from] reqwest::Error),
}

impl IntoResponse for ResponseError {
    fn into_response(self) -> axum::response::Response {
        let body = self.to_string();
        let code = match self {
            ResponseError::Reqwest(_) => StatusCode::INTERNAL_SERVER_ERROR,
        };
        tracing::info!("ResponseError: {body}");
        (code, body).into_response()
    }
}
