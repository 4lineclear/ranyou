import { completeFromList } from "@codemirror/autocomplete";
import { PQLLanguage } from "./pql";

const pqlCompletion = PQLLanguage.data.of({
  autocomplete: completeFromList([
    { label: "let", type: "keyword" },
    { label: "fn", type: "keyword" },
    { label: "end", type: "keyword" },
    { label: "select", type: "keyword" },
    { label: "from", type: "keyword" },
    { label: "where", type: "keyword" },
    { label: "order by", type: "keyword" },
    { label: "return", type: "keyword" },
    { label: "not", type: "keyword" },
    { label: "in between", type: "keyword" },
    { label: "like", type: "keyword" },
  ]),
});

export default pqlCompletion;
