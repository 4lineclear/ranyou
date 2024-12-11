import {
  fetchItems,
  PlaylistItem,
  PlaylistRecord,
  PlaylistRecords,
} from "@/lib/youtube";
import iso8601, { Duration } from "iso8601-duration";

export type Index = { index: number };

export type FiorData = {
  columns: Record<string, FiorColumn>;
};
export type FiorColumn = {
  records: string[];
  rows: Record<string, FiorItem>;
  name: string;
} & Index;

export type FiorItem = (Filter | Order) & Index;
export type Filter = {
  not?: boolean;
  filter: Search | Predicate;
};
export type Search = {
  /** The values being searched */
  cols: Key[];
  search: string;
  regex: boolean;
};
export type PredicateOperator = "==" | "!=" | "<" | ">" | "<=" | ">=";
export type Predicate = {
  /** The values being searched */
  cols?: IsolatedKeys;
  operator: PredicateOperator;
  value: string;
};
export type Order = {
  rev?: boolean;
  order: SortBy;
};
export type SortBy = {
  /** The values being searched */
  cols: Key[];
};

export type IsolatedKeys =
  | {
      index: boolean;
      position: boolean;
    } // number
  | {
      video_id: boolean;
      channel_id: boolean;
    } // id
  | {
      title: boolean;
      description: boolean;
      note: boolean;
      duration: boolean;
      channel_title: boolean;
    } // string
  | {
      duration: boolean;
    } // duration
  | {
      added_at: boolean;
      published_at: boolean;
    }; // date
export const Operators: PredicateOperator[] = [
  "==",
  "!=",
  "<",
  ">",
  "<=",
  ">=",
];
export const PlItemData: Record<Key, string> = {
  index: "number",
  video_id: "id",
  title: "string",
  description: "string",
  note: "string",
  position: "number",
  channel_title: "string",
  channel_id: "id",
  duration: "duration",
  added_at: "date",
  published_at: "date",
};
export const PlItemKeys = Object.keys(PlItemData).map((k) => k as Key);

export type Key = "index" | keyof PlaylistItem;

export type PlaylistData = Record<string, [PlaylistRecord, PlaylistItem[]]>;

const toSec = (s: string) => iso8601.toSeconds(iso8601.parse(s));
const cmpIndex = (a: Index, b: Index) => a.index - b.index;

const applyOperator = (
  a: string | number | Date,
  b: string | number | Date,
  op: PredicateOperator,
) => {
  if (typeof a !== typeof b) return false;
  switch (op) {
    case "==":
      return a == b;
    case "!=":
      return a != b;
    case "<":
      return a < b;
    case ">":
      return a > b;
    case "<=":
      return a <= b;
    case ">=":
      return a >= b;
  }
  return false;
};

export const readPlaylistData = async (records: PlaylistRecords) => {
  const playlists: PlaylistData = {};
  for (const record of Object.values(records)) {
    const items: PlaylistItem[] = await fetchItems(record.playlist_id);
    playlists[record.playlist_id] = [record, items];
  }
  return playlists;
};

export const dataQuery = ({
  data,
  columns,
  playlists,
}: {
  data: FiorData;
  columns: string[];
  playlists: PlaylistData;
}) => {
  const output: Record<string, Record<string, PlaylistItem[]>> = {};
  for (const c of columns.filter((c) => data.columns[c]))
    output[c] = columnQuery({ data: data.columns[c], playlists });
  return output;
};

export const columnQuery = ({
  data,
  playlists,
}: {
  data: FiorColumn;
  playlists: PlaylistData;
}) => {
  const output: Record<string, PlaylistItem[]> = {};
  for (const [pr, pi] of data.records
    .filter((k) => playlists[k])
    .map((k) => playlists[k])) {
    const itemRecord = [pi];
    for (const row of Object.values(data.rows).toSorted(cmpIndex)) {
      itemRecord.push(
        rowQuery({ data: row, items: itemRecord[itemRecord.length - 1] }),
      );
    }
    output[pr.playlist_id] = itemRecord[itemRecord.length - 1];
  }
  return output;
};

// TODO: consider using & returning index's instead of items
const whitespace = /\s+/g;
export const rowQuery = ({
  data,
  items,
}: {
  data: FiorItem;
  items: PlaylistItem[];
}) => {
  if ("filter" in data) {
    let run: (pi: PlaylistItem, i: number) => boolean;
    const filter = data.filter;
    if ("search" in filter) {
      if (filter.cols.length === 0 || filter.search === "") return items;
      const searchString = filter.search.toLowerCase().replace(whitespace, "");
      let search = (h: string) =>
        h.toLowerCase().replace(whitespace, "").includes(searchString);
      if (filter.regex) {
        try {
          const re = new RegExp(filter.search);
          search = (h) => re.test(h.toLowerCase().replace(whitespace, ""));
        } catch {
          return items;
        }
      }
      run = (pi, i) => {
        for (const col of filter.cols) {
          if (col === "index") {
            if (search(i.toString())) return true;
          } else {
            if (!pi[col]) continue;
            if (search(pi[col].toString())) return true;
          }
        }
        return false;
      };
    } else {
      if (!filter.cols || filter.value === "") return items;
      const keys = Object.entries(filter.cols)
        .filter(([, v]) => v)
        .map(([k]) => k as Key);

      let value: string | number | Date | Duration = filter.value;
      const vType = PlItemData[keys[0]];
      if (vType === "number") value = parseFloat(filter.value);
      if (vType === "duration") value = toSec(filter.value);
      if (vType === "date") value = new Date(filter.value);

      run = (pi, i) => {
        return keys.some((col) =>
          applyOperator(
            col === "index" ? i : col === "duration" ? toSec(pi[col]) : pi[col],
            value,
            filter.operator,
          ),
        );
      };
    }
    return data.not ? items.filter((pi, i) => !run(pi, i)) : items.filter(run);
  } else {
    return items;
    // return items.toSorted((a, b));
  }
};
