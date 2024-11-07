update playlist_records
set
  read_count = playlist_records.read_count + 1
where
  playlist_id = $1
returning
  *;
