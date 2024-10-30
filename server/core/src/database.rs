use std::collections::HashSet;

use bb8_postgres::tokio_postgres::{Client, Row};
use bb8_postgres::{bb8, tokio_postgres, PostgresConnectionManager};

use bb8::ManageConnection;

use tokio_postgres::{types::ToSql, Config, NoTls};

use crate::errors::{ResponseError, ResponseResult};
use crate::model::PlaylistItem;

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
    "createPlaylistRecordsTable" as CREATE_RECORDS_TABLE,
    "insertPlaylistRecord" as INSERT_PLAYLIST_RECORDS,
    "createPlaylistItemsTable" as CREATE_PLAYLIST_ITEMS_TABLE,
    "insertPlaylistItems" as INSERT_PLAYLIST_ITEMS,
    "selectPlaylistItems" as SELECT_PLAYLIST_ITEMS
);

impl Database {
    pub fn new(config: Config) -> ResponseResult<Self> {
        let inner = PostgresConnectionManager::new(config, NoTls);
        Ok(Self { inner })
    }
    pub async fn create_tables(&self) -> ResponseResult<()> {
        self.execute(CREATE_RECORDS_TABLE, &[]).await?;
        self.execute(CREATE_PLAYLIST_ITEMS_TABLE, &[]).await?;
        Ok(())
    }
    /// returns the records's count
    pub async fn push_record(&self, playlist_id: &str) -> ResponseResult<i32> {
        // TODO: validate if playlist actually exists
        let row = self
            .query_one(INSERT_PLAYLIST_RECORDS, &[&playlist_id])
            .await?;
        let count = row.get::<_, i32>(0);
        Ok(count)
    }
    pub async fn push_items(
        &self,
        playlist_id: &str,
        items: &HashSet<PlaylistItem>,
    ) -> ResponseResult<()> {
        let mut conn = self.conn().await?;
        let tx = conn.transaction().await?;
        let statement = tx.prepare(INSERT_PLAYLIST_ITEMS).await?;
        for item in items {
            tx.execute(
                &statement,
                &[
                    &item.video_id,
                    &playlist_id,
                    &item.title,
                    &item.description,
                    &item.note,
                    &item.position,
                    &item.channel_title,
                    &item.channel_id,
                    &item.added_at,
                    &item.published_at,
                ],
            )
            .await?;
        }
        tx.commit().await?;
        Ok(())
    }
    pub async fn get_items(&self, playlist_id: &str) -> ResponseResult<HashSet<PlaylistItem>> {
        self.query(SELECT_PLAYLIST_ITEMS, &[&playlist_id])
            .await?
            .into_iter()
            .map(TryFrom::try_from)
            .collect::<Result<_, _>>()
            .map_err(ResponseError::from)
    }
    async fn execute(&self, sql: &str, params: Params<'_>) -> ResponseResult<u64> {
        Ok(self.conn().await?.execute(sql, params).await?)
    }
    async fn query_one(&self, sql: &str, params: Params<'_>) -> ResponseResult<Row> {
        Ok(self.conn().await?.query_one(sql, params).await?)
    }
    async fn query(&self, sql: &str, params: Params<'_>) -> ResponseResult<Vec<Row>> {
        Ok(self.conn().await?.query(sql, params).await?)
    }
    async fn conn(&self) -> ResponseResult<Client> {
        Ok(self.inner.connect().await?)
    }
}

type Params<'a> = &'a [&'a (dyn ToSql + Sync)];
