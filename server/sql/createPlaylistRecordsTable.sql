create table if not exists playlist_records (
  playlist_id text primary key,
  count integer not null default 1 check (count >= 0)
)
