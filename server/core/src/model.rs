use std::hash::Hash;

use bb8_postgres::tokio_postgres::Row;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlaylistItem {
    pub video_id: String,
    pub title: String,
    pub description: String,
    pub note: String,
    pub position: i32,
    pub channel_title: String,
    pub channel_id: String,
    /// ISO 8601
    pub added_at: DateTime<Utc>,
    /// ISO 8601
    pub published_at: DateTime<Utc>,
}

impl TryFrom<Row> for PlaylistItem {
    type Error = bb8_postgres::tokio_postgres::Error;

    fn try_from(row: Row) -> Result<Self, Self::Error> {
        Ok(Self {
            video_id: row.try_get(0)?,
            // playlist_id - ignore
            title: row.try_get(2)?,
            description: row.try_get(3)?,
            note: row.try_get(4)?,
            position: row.try_get(5)?,
            channel_title: row.try_get(6)?,
            channel_id: row.try_get(7)?,
            added_at: row.try_get(8)?,
            published_at: row.try_get(9)?,
        })
    }
}

impl PartialEq for PlaylistItem {
    fn eq(&self, other: &Self) -> bool {
        self.video_id.eq(&other.video_id)
    }
}

impl Eq for PlaylistItem {}

impl Hash for PlaylistItem {
    fn hash<H: std::hash::Hasher>(&self, state: &mut H) {
        self.video_id.hash(state);
    }
}
