use bb8_postgres::tokio_postgres::{Client, Row};
use bb8_postgres::{bb8, tokio_postgres, PostgresConnectionManager};

use bb8::ManageConnection;

use tokio_postgres::{types::ToSql, Config, NoTls};
use tracing::{error, info};

use crate::errors::ResponseResult;
use crate::model::{PlaylistItem, PlaylistRecord};

macro_rules! sql {
    ($(
        $path:literal as $name:ident
    ),*) => {
        $(
            pub const $name: &str = core::include_str!(concat!("../../sql/", $path, ".sql"));
        )*
    };
}

#[derive(Clone)]
pub struct Database {
    inner: PostgresConnectionManager<NoTls>,
}

sql!(
    "record/create" as CREATE_RECORD,
    "record/insert" as INSERT_RECORD,
    "record/update" as UPDATE_RECORD,
    "record/select" as SELECT_RECORD,
    "item/create" as CREATE_ITEMS,
    "item/insert" as INSERT_ITEMS,
    "item/select" as SELECT_ITEMS
);

impl Database {
    pub fn new(config: Config) -> ResponseResult<Self> {
        let inner = PostgresConnectionManager::new(config, NoTls);
        Ok(Self { inner })
    }
    pub async fn create_tables(&self) -> ResponseResult<()> {
        self.execute(CREATE_RECORD, &[]).await?;
        self.execute(CREATE_ITEMS, &[]).await?;
        Ok(())
    }
    pub async fn get_record(&self, playlist_id: &str) -> ResponseResult<Option<PlaylistRecord>> {
        Ok(self
            .query_opt(SELECT_RECORD, &[&playlist_id])
            .await?
            .map(PlaylistRecord::try_from)
            .transpose()?)
    }
    pub async fn update_record(&self, playlist_id: &str) -> ResponseResult<Option<PlaylistRecord>> {
        Ok(self
            .query_opt(UPDATE_RECORD, &[&playlist_id])
            .await?
            .map(PlaylistRecord::try_from)
            .transpose()?)
    }
    pub async fn push_record(&self, record: &PlaylistRecord) -> ResponseResult<()> {
        let params: Params = &[
            &record.playlist_id,
            &record.published_at,
            &record.channel_id,
            &record.channel_title,
            &record.title,
            &record.description,
            &record.privacy_status,
            &record.thumbnail,
            &record.playlist_length,
        ];
        if let Err(err) = self.execute(INSERT_RECORD, params).await {
            info!("failed to push record to db: {err}");
            Err(err)
        } else {
            Ok(())
        }
    }
    pub async fn push_items(
        &self,
        playlist_id: &str,
        items: &[PlaylistItem],
    ) -> ResponseResult<()> {
        let mut conn = self.conn().await?;
        let tx = conn.transaction().await?;
        let statement = tx.prepare(INSERT_ITEMS).await?;
        for item in items {
            let params: Params = &[
                &item.video_id,
                &playlist_id,
                &item.title,
                &item.description,
                &item.note,
                &item.position,
                &item.channel_title,
                &item.channel_id,
                &item.duration,
                &item.added_at,
                &item.published_at,
            ];
            tx.execute(&statement, params).await?;
        }
        tx.commit().await?;
        Ok(())
    }
    pub async fn get_items(&self, playlist_id: &str) -> ResponseResult<Vec<PlaylistItem>> {
        Ok(self
            .query(SELECT_ITEMS, &[&playlist_id])
            .await?
            .into_iter()
            .filter_map(|r| {
                PlaylistItem::try_from(r)
                    .inspect_err(|e| error!("malformed db playlist item: {e}"))
                    .ok()
            })
            .collect())
    }

    async fn execute(&self, sql: &str, params: Params<'_>) -> ResponseResult<u64> {
        Ok(self.conn().await?.execute(sql, params).await?)
    }
    #[allow(unused)]
    async fn query_one(&self, sql: &str, params: Params<'_>) -> ResponseResult<Row> {
        Ok(self.conn().await?.query_one(sql, params).await?)
    }
    async fn query_opt(&self, sql: &str, params: Params<'_>) -> ResponseResult<Option<Row>> {
        Ok(self.conn().await?.query_opt(sql, params).await?)
    }
    async fn query(&self, sql: &str, params: Params<'_>) -> ResponseResult<Vec<Row>> {
        Ok(self.conn().await?.query(sql, params).await?)
    }
    async fn conn(&self) -> ResponseResult<Client> {
        Ok(self.inner.connect().await?)
    }
}

type Params<'a> = &'a [&'a (dyn ToSql + Sync)];
