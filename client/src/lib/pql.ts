/* easy sql */

import { SyntaxNodeRef, TreeCursor } from "@lezer/common";
import { parser } from "./pql/pql-parser";
import {
  LRLanguage,
  LanguageSupport,
  foldInside,
  foldNodeProp,
  indentNodeProp,
  syntaxTree,
} from "@codemirror/language";
import { EditorState } from "@uiw/react-codemirror";
// import { styleTags, tags as t } from "@lezer/highlight";

export type SelectSet = Select[];
export type Select = {
  select: "*" | Name[];
  from: "*" | Name[];
  where?: Predicate;
  orderBy?: Name[];
};
export type Predicate = {
  left: Value;
  cmp: "<" | ">" | "<=" | ">=" | "==" | "!=" | "&&" | "||";
  right: Value;
};
export type Value = Name | Tuple | string | number | boolean | Predicate;
export type Name = { name: string };
export type Tuple = Value[];

export const parseTools = (state: EditorState, cursor: TreeCursor) => {
  if (!cursor.firstChild()) return null;

  const slice = (from?: number, to?: number) => state.sliceDoc(from, to);
  const checkName = (expected?: string) =>
    expected ? cursor.name === expected : true;
  return {
    iterate: (
      enter: (node: SyntaxNodeRef) => boolean | void,
      leave?: (node: SyntaxNodeRef) => void,
    ) => cursor.iterate(enter, leave),
    from: () => cursor.from,
    to: () => cursor.to,
    name: () => cursor.name,
    parent: () => cursor.parent(),
    firstChild: (expected?: string) =>
      cursor.firstChild() && checkName(expected),
    nextSibling: () => cursor.nextSibling(),
    slice,
    sliceHere: () => slice(cursor.from, cursor.to),
    nextNWS(expected?: string) {
      do {
        if (!cursor.nextSibling()) return false;
      } while (cursor.name === "Spaces" || cursor.name === "NewLine");
      return checkName(expected);
    },
    prevNWS(expected?: string) {
      do {
        if (!cursor.prevSibling()) return false;
      } while (cursor.name === "Spaces" || cursor.name === "NewLine");
      return checkName(expected);
    },
    until(until: string) {
      do {
        if (!cursor.nextSibling()) return false;
      } while (cursor.name !== until);
      return true;
    },
  };
};

export const parse = (state: EditorState) => {
  console.clear();
  const tools = parseTools(state, syntaxTree(state).cursor());
  if (!tools) return [];
  const {
    name,
    parent,
    // until,
    firstChild,
    nextNWS,
    prevNWS,
    sliceHere,
    // from,
    // to,
    // iterate,
  } = tools;
  const set: SelectSet = [];
  const errs = [];

  const nameArray = () => {
    if (!firstChild("Name")) return null;
    const arr = [];
    do {
      arr.push({ name: sliceHere() });
    } while (nextNWS(",") && nextNWS("Name"));
    parent();
    return arr;
  };

  const parseCmp = () => {
    const cmp = sliceHere();
    switch (cmp) {
      case "<":
      case ">":
      case "<=":
      case ">=":
      case "==":
      case "!=":
      case "&&":
      case "||":
        return cmp;
      default:
        return null;
    }
  };
  const value = (): Value | null => {
    switch (name()) {
      case "Name":
        return { name: sliceHere() };
        break;
      case "Tuple": {
        if (!firstChild("Value")) return [];
        const tuple = [];
        do {
          if (!firstChild()) continue;
          const val = value();
          if (val) tuple.push(val);
          parent();
        } while (nextNWS(",") && nextNWS("Value"));
        parent();
        return tuple;
      }
      case "String":
        return sliceHere().slice(1, -1);
      case "Number":
        return parseFloat(sliceHere());
      case "ConstBool":
        return sliceHere() === "true";
      case "Predicate":
        return predicate();
    }
    return null;
  };

  const predicate = (): Predicate | null => {
    if (!firstChild("Value") || !firstChild()) return null;
    const left = value();
    if (!left) return null;
    if (!parent() || !nextNWS("Cmp")) return null;
    const cmp = parseCmp();
    if (!cmp) return null;
    if (!nextNWS("Value") || !firstChild()) return null;
    const right = value();
    if (!right) return null;
    parent();
    parent();
    return { left, cmp, right };
  };

  do {
    const sel: Select = {
      select: "*",
      from: "*",
    };

    if (!firstChild("select")) break;
    if (!nextNWS()) break;

    console.log(name());
    select: if (name() === "NameArray") {
      const names = nameArray();
      if (!names || !nextNWS()) break select;
      sel.select = names;
    }
    if (name() !== "from") break;

    from: if (nextNWS()) {
      const names = nameArray();
      if (!names) {
        prevNWS();
        break from;
      }
      sel.from = names;
    } else {
    }
    console.log(name());
    if (nextNWS("where") && nextNWS("Predicate")) {
      const where = predicate();
      if (where) sel.where = where;
    }
    order: if (nextNWS("order")) {
      if (!nextNWS("by")) break;
      if (!nextNWS("NameArray")) break order;
      const names = nameArray();
      if (!names || !nextNWS()) break order;
      sel.orderBy = names;
    }
    set.push(sel);
    while (name() !== "Select" && parent());
  } while (nextNWS());
  // console.log(set);
  return set;
};

// export interface PlaylistItem {
//   video_id: string;
//   title: string;
//   description: string;
//   note: string;
//   position: number;
//   channel_title: string;
//   channel_id: string;
//   duration: string;
//   added_at: Date;
//   published_at: Date;
// }
//
// export interface PlaylistRecord {
//   playlist_id: string;
//   published_at: Date;
//   channel_id: string;
//   channel_title: string;
//   title: string;
//   description: string;
//   privacy_status: string;
//   thumbnail: string;
//   playlist_length: number;
// }

export const PQLLanguage = LRLanguage.define({
  name: "pql",
  parser: parser.configure({
    // strict: true,
    props: [
      indentNodeProp.add({
        Application: (context) =>
          context.column(context.node.from) + context.unit,
      }),
      foldNodeProp.add({
        Application: foldInside,
      }),
    ],
  }),
  languageData: {
    closeBrackets: { brackets: ["(", "[", "{", "'", '"', "`"] },
    commentTokens: { line: "--" },
    indentOnInput: /^\s*(?:case |default:|\{|\}|<\/)$/,
    wordChars: "$",
  },
});

export default function pqlLanguageSupport() {
  return new LanguageSupport(PQLLanguage, []);
}
