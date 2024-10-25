// TODO: put this in it's own bin.

use lambda_http::tracing;
use ranyou_api::Context;

#[tokio::main]
async fn main() -> Result<(), lambda_http::Error> {
    tracing::init_default_subscriber();
    let config = aws_config::load_from_env().await;
    let context = Context {
        db: aws_sdk_dynamodb::Client::new(&config),
        lambda: aws_sdk_lambda::Client::new(&config),
        youtube: ranyou_api::setup_youtube().await,
    };
    lambda_http::run(lambda_http::service_fn(|event| {
        ranyou_api::handler(event, &context)
    }))
    .await
}
