import {
  fetchItems,
  PlaylistItem,
  PlaylistRecord,
  PlaylistRecords,
} from "@/lib/youtube";
import iso8601, { Duration } from "iso8601-duration";
import { shuffle } from "./random";
import { Random } from "random";

export type StatusValue = "success" | "error" | "warning" | "info";

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
  filter: RandomSelect | Search | Predicate;
};
export type RandomSelect = {
  selectCount: number;
  rngSeed: string;
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
  order: SortBy | Randomize;
};
export type SortBy = {
  /** The values being searched */
  cols: Key[];
};
export type Randomize = {
  rngSeed: string;
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
  // console.log(a, b);
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
  console.log(data);
  const output: Record<string, PlaylistItem[]> = {};
  for (const [pr, pi] of data.records
    .filter((k) => playlists[k])
    .map((k) => playlists[k])) {
    const itemRecord = [pi];
    for (const row of Object.values(data.rows).toSorted(cmpIndex)) {
      console.log(row);
      itemRecord.push(
        rowQuery({ data: row, items: itemRecord[itemRecord.length - 1] }),
      );
    }
    output[pr.playlist_id] = itemRecord[itemRecord.length - 1];
    console.log(itemRecord);
  }
  return output;
};

// TODO: add rng seeds.

// TODO: break down this function into smaller parts

// TODO: consider using & returning indices instead of items
const cleanStr = (s: string) => s.toLowerCase().replace(/\s+/g, "");
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
      const searchString = cleanStr(filter.search);
      let search = (h: string) => cleanStr(h).includes(searchString);
      if (filter.regex) {
        try {
          const re = new RegExp(filter.search);
          search = (h) => re.test(cleanStr(h));
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
    } else if ("operator" in filter) {
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
    } else if ("rngSeed" in filter) {
      if (filter.selectCount >= items.length || filter.selectCount <= 0)
        return items;
      const rng = new Random(filter.rngSeed).uniform();
      const randomItems: [PlaylistItem, number][] = items.map((pi, i) => [
        pi,
        i,
      ]);
      shuffle(rng, randomItems);
      console.log(
        randomItems
          .slice(0, filter.selectCount)
          .toSorted(([, i1], [, i2]) => i1 - i2),
      );
      const sliced = data.not
        ? randomItems.slice(filter.selectCount)
        : randomItems.slice(0, filter.selectCount);
      return sliced.toSorted(([, i1], [, i2]) => i1 - i2).map(([pi]) => pi);
    } else {
      return items;
    }
    return data.not ? items.filter((pi, i) => !run(pi, i)) : items.filter(run);
  } else {
    if ("cols" in data.order) {
      const cols = data.order.cols;
      const sort = (a: PlaylistItem, b: PlaylistItem) => {
        return cols.reduce((p, k) => {
          p *= 10;
          if (k === "index") return p + 1;
          if (typeof a[k] !== typeof b[k]) return p;
          if (typeof a[k] === "object") {
            p += a[k].getTime() - (b[k] as Date).getTime();
          } else if (typeof a[k] === "string") {
            p +=
              k === "duration"
                ? toSec(a[k]) - toSec(b[k] as string)
                : cleanStr(a[k]).localeCompare(cleanStr(b[k] as string));
          } else {
            p += a[k] - (b[k] as number);
          }
          return p;
        }, 0);
      };
      return data.rev
        ? items.toSorted((a, b) => -sort(a, b))
        : items.toSorted(sort);
    } else {
      const rng = new Random(data.order.rngSeed).uniform();
      shuffle(rng, items);
      if (data.rev) items.reverse();
      return items;
    }
  }
};
