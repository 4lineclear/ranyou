import { createFileRoute } from "@tanstack/react-router";

type SearchParams = {
  playlistId: string;
  index: number;
  fior?: string;
};

export const Route = createFileRoute("/play/")({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    let index = 1;
    if (typeof search["playlistId"] !== "string")
      throw new Error("invalid params");
    if (typeof search["index"] === "number") {
      index = search["index"];
    } else if (typeof search["index"] === "string") {
      index = parseInt(search["index"]);
    }
    if (isNaN(index) || index < 1) index = 1;
    return {
      fior: typeof search["fior"] === "string" ? search["fior"] : undefined,
      index,
      playlistId: search["playlistId"],
    };
  },
});
