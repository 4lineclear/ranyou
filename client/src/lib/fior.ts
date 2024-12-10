import {
  fetchItems,
  PlaylistItem,
  PlaylistRecord,
  PlaylistRecords,
} from "@/lib/youtube";

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
  cols: Key[];
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

export type Key = "index" | keyof PlaylistItem;

export type PlaylistData = Record<string, [PlaylistRecord, PlaylistItem[]]>;

const cmpIndex = (a: Index, b: Index) => a.index - b.index;

export const runQuery = async ({
  data,
  columns,
  records,
}: {
  data: FiorData;
  columns: string[];
  records: PlaylistRecords;
}) => {
  const playlists: PlaylistData = {};
  for (const record of Object.values(records)) {
    const items: PlaylistItem[] = await fetchItems(record.playlist_id);
    playlists[record.playlist_id] = [record, items];
  }
  return dataQuery({ data, columns, playlists });
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
    if (filter.cols.length === 0) return items;
    if ("search" in filter) {
      let search = (h: string) => h.includes(filter.search);
      if (filter.regex) {
        try {
          const re = new RegExp(filter.search);
          search = (h) => re.test(h);
        } catch {
          return items;
        }
      }
      run = (pi, i) => {
        for (const col of filter.cols) {
          if (col === "index") {
            if (search(i.toString())) return true;
          } else {
            if (!pi[col]) return false;
            if (search(pi[col].toString())) return true;
          }
        }
        return false;
      };
    } else {
      // filter.value;
      // filter.operator;
      run = () => false;
    }
    return data.not ? items.filter((pi, i) => !run(pi, i)) : items.filter(run);
  } else {
    return items;
    // return items.toSorted((a, b));
  }
};
