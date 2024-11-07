insert into
  playlist_items (
    video_id,
    playlist_id,
    title,
    description,
    note,
    position,
    channel_title,
    channel_id,
    added_at,
    published_at
  )
values
  ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
on conflict do nothing;
