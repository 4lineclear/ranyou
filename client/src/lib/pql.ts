/* easy sql */

import { parser } from "./pql/pql-parser";
import {
  LRLanguage,
  LanguageSupport,
  foldInside,
  foldNodeProp,
  indentNodeProp,
} from "@codemirror/language";
// import { styleTags, tags as t } from "@lezer/highlight";

export type Span = SSpan | CSpan;

/** Simple Span */
type SSpan = {
  /** From */
  f: number;
  /** To */
  t: number;
};
/** Complex Span */
type CSpan = {
  /** From Line */
  lf: number;
  /** From Index*/
  fi: number;
  /** To Line */
  lt: number;
  /** To Index */
  ti: number;
};

export type PQLState = {
  statements: Statement[];
};
type Statement = {
  span: CSpan;
  kind: "return" | { name: Name };
  value: Fn | Select | Join | Array | Value;
};
type Fn = {
  params: FnParams;
};
type FnParams = {
  name: Name;
  type?: Name;
}[];
type Select = {
  select?: NameArray;
  from: NameArray;
  where?: Predicate;
  orderBy?: NameArray | Fn;
};
type Predicate = {
  not?: "not";
  a: Value;
  cmp: Cmp;
  b: Value;
  next?: {
    op: BoolOp;
    value: Value;
  };
};
type BoolOp = SSpan & ("and" | "or" | "xor" | "nand" | "nor" | "xnor");
type Cmp =
  | "="
  | "<"
  | ">"
  | "<="
  | ">="
  | "in"
  | "between"
  | "like"
  | ["similar", "to"];
type Value = FnCall | Tuple | string | number | ConstBool | Predicate;
type FnCall = {
  name: Name;
  params: Array;
};
type Tuple = Array;
type Array = Value[];
type Join = {
  join: "join";
  names: NameArray;
};
type NameArray = Name[];
type Name = string;
type ConstBool = true | false;

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
