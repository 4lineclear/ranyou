import { PlaylistItem } from "ranyou-shared/src";

export type FiorData = {
  columns: Record<string, FiorColumn>;
};
export type FiorColumn = {
  rows: Record<string, FiorItem>;
  name: string;
};

export type FiorItem = Filter | Order;
export type Filter = {
  not?: boolean;
  filter: Search | Predicate;
};
export type Search = {
  /** The values being searched */
  cols: Key[];
  search: string;
  regex?: boolean;
};
export type Predicate = {
  /** The values being searched */
  col: Key;
  operator: "==" | "!=" | "<" | ">" | "<=" | ">=";
  value: string | number;
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