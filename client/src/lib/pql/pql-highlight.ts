import { styleTags, tags as t } from "@lezer/highlight";

export const highlight = styleTags({
  // Identifier: t.variableName,
  // Boolean: t.bool,
  // String: t.string,
  // LineComment: t.lineComment,
  // "( )": t.paren,
  "let fn end return select from where order by": t.keyword,
  "< <= > >= & | ^": t.compareOperator,
  "like in between": t.operatorKeyword,
  ",": t.punctuation,
  ";": t.punctuation,
  Name: t.variableName,
  Type: t.className,
  ConstBool: t.bool,
  String: t.string,
  Comment: t.lineComment,
  Number: t.number,
});
