insert into
  playlist_records (
    playlist_id,
    published_at,
    channel_id,
    channel_title,
    title,
    description,
    privacy_status,
    thumbnail,
    playlist_length
  )
values
  ($1, $2, $3, $4, $5, $6, $7, $8, $9)
on conflict (playlist_id) do nothing;
