import { linter, Diagnostic } from "@codemirror/lint";
import { parse } from "./pql";

const pqlLinter = linter((view) => {
  // console.clear();
  const state = view.state;
  // const tools = parseTools(state, syntaxTree(view.state).cursor());

  const set = parse(state);
  // console.log(set);
  const diagnostics: Diagnostic[] = [];
  // const readParams = () => {
  //   const params: Record<string, string> = {};
  //   firstChild();
  //   nextNWS();
  //   if (name() === "FnParams") {
  //     firstChild(); // param
  //     do {
  //       if (!firstChild()) break;
  //       const name = sliceHere();
  //       nextNWS();
  //       const type = sliceHere();
  //       parent();
  //       params[name] = type;
  //     } while (nextNWS() && name() === "," && nextNWS());
  //     parent();
  //   } else {
  //     prevNWS();
  //   }
  //   return params;
  // };

  // const duplicate = (): Diagnostic => ({
  //   from: from(),
  //   to: to(),
  //   severity: "error",
  //   message: "duplicate variable found",
  // });
  //
  // const nameArray = () => {
  //   if (!firstChild("Name")) return null;
  //   const arr = [];
  //   do {
  //     arr.push({ name: sliceHere() });
  //   } while (nextNWS(",") && nextNWS("Name"));
  //   parent();
  //   return arr;
  // };
  // const parseCmp = () => {
  //   const cmp = sliceHere();
  //   switch (cmp) {
  //     case "<":
  //     case ">":
  //     case "<=":
  //     case ">=":
  //     case "==":
  //     case "!=":
  //     case "&&":
  //     case "||":
  //       return cmp;
  //     default:
  //       return null;
  //   }
  // };
  // const value = (): Value | null => {
  //   switch (name()) {
  //     case "Name":
  //       return { name: sliceHere() };
  //       break;
  //     case "Tuple": {
  //       if (!firstChild("Value")) return [];
  //       const tuple = [];
  //       do {
  //         if (!firstChild()) continue;
  //         const val = value();
  //         if (val) tuple.push(val);
  //         parent();
  //       } while (nextNWS(",") && nextNWS("Value"));
  //       parent();
  //       return tuple;
  //     }
  //     case "String":
  //       return sliceHere().slice(1, -1);
  //     case "Number":
  //       return parseFloat(sliceHere());
  //     case "ConstBool":
  //       return sliceHere() === "true";
  //     case "Predicate":
  //       return predicate();
  //   }
  //   return null;
  // };
  //
  // const predicate = (): Predicate | null => {
  //   if (!firstChild("Value") || !firstChild()) return null;
  //   const left = value();
  //   if (!left) return null;
  //   if (!parent() || !nextNWS("Cmp")) return null;
  //   const cmp = parseCmp();
  //   if (!cmp) return null;
  //   if (!nextNWS("Value") || !firstChild()) return null;
  //   const right = value();
  //   if (!right) return null;
  //   parent();
  //   parent();
  //   return { left, cmp, right };
  // };
  //
  // do {
  //   const sel: Select = {
  //     select: "*",
  //     from: "*",
  //   };
  //   if (!firstChild("select")) break;
  //   if (!nextNWS()) break;
  //   select: if (name() === "NameArray") {
  //     const names = nameArray();
  //     if (!names || !nextNWS()) break select;
  //     sel.select = names;
  //   }
  //   if (name() !== "from") break;
  //   from: if (nextNWS()) {
  //     const names = nameArray();
  //     if (!names) {
  //       prevNWS();
  //       break from;
  //     }
  //     sel.from = names;
  //   }
  //   if (nextNWS("where") && nextNWS("Predicate")) {
  //     const where = predicate();
  //     if (where) sel.where = where;
  //   }
  //   order: if (nextNWS("order")) {
  //     if (!nextNWS("by")) break;
  //     if (!nextNWS("NameArray")) break order;
  //     const names = nameArray();
  //     if (!names || !nextNWS()) break order;
  //     sel.orderBy = names;
  //   }
  //   set.push(sel);
  //   while (name() !== "Select" && parent());
  // } while (nextNWS());
  // console.log(set);
  // while (firstChild()) {
  //   if (name() === "let") {
  //     nextNWS();
  //     if (curr.decls[sliceHere()]) diagnostics.push(duplicate());
  //     curr.decls[sliceHere()] = sliceHere();
  //     prevNWS();
  //   }
  //   if (!until("StatementValue")) break;
  //   if (!firstChild()) break;
  //   if (name() === "Fn") {
  //     curr.scopes.push({
  //       scopes: [],
  //       decls: {},
  //       params: readParams(),
  //       nameUsages: [],
  //       parent: curr,
  //     });
  //     if (nextNWS() && name() !== "end") {
  //       run(curr.scopes.at(-1)!, depth + 1);
  //       nextNWS();
  //       parent();
  //     }
  //   } else {
  //     iterate((node) => {
  //       if (node.name !== "Name") return;
  //       const range = state.wordAt(node.from);
  //       if (range) curr.nameUsages.push(range);
  //       console.log(sliceHere());
  //     });
  //   }
  //   while (name() !== "Statement" && parent());
  //   if (!nextNWS()) break;
  // }
  // outer: for (const name of curr.nameUsages) {
  //   const nameS = state.sliceDoc(name.from, name.to);
  //   let p: Scope | undefined = curr;
  //   while (p) {
  //     if (p.decls[nameS] || p.params[nameS]) continue outer;
  //     p = p.parent;
  //   }
  //   diagnostics.push(unknownVar(name.from, name.to));
  // }
  return diagnostics;
});
export default pqlLinter;
