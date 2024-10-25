use lambda_runtime::Diagnostic;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ResponseError {
    #[error("missing playlist-id query")]
    MissingPlaylistId,
    #[error("google youtube error: {0}")]
    YouTube(#[from] google_youtube3::Error),
}

impl From<ResponseError> for Diagnostic {
    fn from(error: ResponseError) -> Diagnostic {
        Diagnostic {
            error_type: "ResponseError".into(),
            error_message: error.to_string(),
        }
    }
}
