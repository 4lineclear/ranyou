-- Store datetime as TEXT (ISO 8601 format for SQLite compatibility)
create table if not exists playlist_items (
  video_id text not null primary key,
  playlist_id text not null,
  title text not null,
  description text,
  note text,
  position integer not null check (position >= 0),
  channel_title text not null,
  channel_id text not null,
  duration integer not null check (position >= 0),
  added_at timestamp with time zone not null,
  published_at timestamp with time zone not null
);
