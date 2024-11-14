import { PlaylistItem, PlaylistRecord } from "ranyou-shared/src/index";
import postgres from "postgres";

const sql = postgres(process.env["PG_URL"]!, {
  onnotice: undefined,
});

export namespace record {
  export const create = async () =>
    await sql`
  create table if not exists playlist_records (
    playlist_id text primary key,
    published_at timestamp with time zone not null,
    channel_id text not null,
    channel_title text not null,
    title text not null,
    description text not null,
    privacy_status text not null,
    thumbnail text not null,
    playlist_length integer not null check (playlist_length >= 0),
    read_count integer not null default 1 check (read_count >= 0),
    recorded_at timestamp with time zone not null default now()
);`;

  export const insert = async (pr: PlaylistRecord) =>
    await sql`
insert into playlist_records ${sql(
      pr,
      "playlist_id",
      "published_at",
      "channel_id",
      "channel_title",
      "title",
      "description",
      "privacy_status",
      "thumbnail",
      "playlist_length",
    )}
on conflict (playlist_id) do nothing;`;

  export const select = async (playlistId: string) =>
    await sql`
select
  *
from
  playlist_records
where
  playlist_id = ${playlistId};`;

  export const update = async (playlistId: string) =>
    await sql`
update playlist_records
set
  read_count = playlist_records.read_count + 1
where
  playlist_id = ${playlistId}
returning
  *;`;
}

export namespace item {
  export const create = async () => sql`
create table if not exists playlist_items (
  video_id text not null primary key,
  playlist_id text not null,
  title text not null,
  description text,
  note text,
  position integer not null check (position >= 0),
  channel_title text not null,
  channel_id text not null,
  duration interval not null,
  added_at timestamp with time zone not null,
  published_at timestamp with time zone not null
);`;

  export const insert = async (
    pi: (PlaylistItem & { playlist_id: string })[],
  ) => sql`
insert into
  playlist_items
  ${sql(
    pi,
    "video_id",
    "playlist_id",
    "title",
    "description",
    "note",
    "position",
    "channel_title",
    "channel_id",
    "duration",
    "added_at",
    "published_at",
  )}
on conflict do nothing;`;

  export const select = async (playlistId: string) => sql`
select
  *
from
  playlist_items
where
  playlist_id = ${playlistId};
`;
}
