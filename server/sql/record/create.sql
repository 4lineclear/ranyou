create table if not exists playlist_records (
  playlist_id text primary key,
  published_at timestamp with time zone not null,
  channel_id text not null,
  channel_title text not null,
  title text not null,
  description text not null,
  privacy_status text not null,
  thumbnail text,
  playlist_length integer not null check (playlist_length >= 0),
  read_count integer not null default 1 check (read_count >= 0),
  recorded_at timestamp with time zone not null default now()
);
