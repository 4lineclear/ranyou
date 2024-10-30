insert into
  playlist_records (playlist_id)
values
  ($1)
on conflict (playlist_id) do
update
set
  count = playlist_records.count + 1
returning
  count;
