import { syntaxTree } from "@codemirror/language";
import { linter, Diagnostic } from "@codemirror/lint";
import { SyntaxNodeRef, TreeCursor } from "@lezer/common";
import { EditorState, SelectionRange } from "@uiw/react-codemirror";

type Scope = {
  scopes: Scope[];
  decls: Record<string, string>;
  params: Record<string, string>;
  nameUsages: SelectionRange[];
  parent?: Scope;
};

const linterTools = (state: EditorState, cursor: TreeCursor) => {
  if (!cursor.firstChild()) return null;

  const slice = (from?: number, to?: number) => state.sliceDoc(from, to);
  return {
    iterate: (
      enter: (node: SyntaxNodeRef) => boolean | void,
      leave?: (node: SyntaxNodeRef) => void,
    ) => cursor.iterate(enter, leave),
    from: () => cursor.from,
    to: () => cursor.to,
    name: () => cursor.name,
    parent: () => cursor.parent(),
    firstChild: () => cursor.firstChild(),
    nextSibling: () => cursor.nextSibling(),
    slice,
    sliceHere: () => slice(cursor.from, cursor.to),
    nextNWS(expected?: string) {
      do {
        if (!cursor.nextSibling()) return false;
      } while (cursor.name === "Spaces" || cursor.name === "NewLine");
      return expected ? expected === cursor.name : true;
    },
    prevNWS(expected?: string) {
      do {
        if (!cursor.prevSibling()) return false;
      } while (cursor.name === "Spaces" || cursor.name === "NewLine");
      return expected ? expected === cursor.name : true;
    },
    until(expected: string) {
      do {
        if (!cursor.nextSibling()) return false;
      } while (cursor.name !== expected);
      return true;
    },
  };
};

const pqlLinter = linter((view) => {
  console.clear();
  const state = view.state;
  const tools = linterTools(state, syntaxTree(view.state).cursor());
  if (!tools) return [];
  const main: Scope = {
    scopes: [],
    decls: {},
    params: {},
    nameUsages: [],
  };
  const {
    name,
    parent,
    until,
    firstChild,
    nextNWS,
    prevNWS,
    sliceHere,
    from,
    to,
    iterate,
  } = tools;

  const diagnostics: Diagnostic[] = [];

  const readParams = () => {
    const params: Record<string, string> = {};
    firstChild();
    nextNWS();
    if (name() === "FnParams") {
      firstChild(); // param
      do {
        if (!firstChild()) break;
        const name = sliceHere();
        nextNWS();
        const type = sliceHere();
        parent();
        params[name] = type;
      } while (nextNWS() && name() === "," && nextNWS());
      parent();
    } else {
      prevNWS();
    }
    return params;
  };

  const duplicate = (): Diagnostic => ({
    from: from(),
    to: to(),
    severity: "error",
    message: "duplicate variable found",
  });
  const unknownVar = (from: number, to: number): Diagnostic => ({
    from,
    to,
    severity: "warning",
    message: "unknown variable used",
  });

  const run = (curr: Scope, depth: number = 0) => {
    while (firstChild()) {
      if (name() === "let") {
        nextNWS();
        if (curr.decls[sliceHere()]) diagnostics.push(duplicate());
        curr.decls[sliceHere()] = sliceHere();
        prevNWS();
      }
      if (!until("StatementValue")) break;
      if (!firstChild()) break;
      if (name() === "Fn") {
        curr.scopes.push({
          scopes: [],
          decls: {},
          params: readParams(),
          nameUsages: [],
          parent: curr,
        });
        if (nextNWS() && name() !== "end") {
          run(curr.scopes.at(-1)!, depth + 1);
          nextNWS();
          parent();
        }
      } else {
        iterate((node) => {
          if (node.name !== "Name") return;
          const range = state.wordAt(node.from);
          if (range) curr.nameUsages.push(range);
          console.log(sliceHere());
        });
      }
      while (name() !== "Statement" && parent());
      if (!nextNWS()) break;
    }
    outer: for (const name of curr.nameUsages) {
      const nameS = state.sliceDoc(name.from, name.to);
      let p: Scope | undefined = curr;
      while (p) {
        if (p.decls[nameS] || p.params[nameS]) continue outer;
        p = p.parent;
      }
      diagnostics.push(unknownVar(name.from, name.to));
    }
  };
  run(main);
  return diagnostics;
});
export default pqlLinter;
