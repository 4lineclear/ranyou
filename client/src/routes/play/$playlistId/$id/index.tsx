import { createFileRoute } from "@tanstack/react-router";

type SearchParams = {
  fior?: string;
};

export const Route = createFileRoute("/play/$playlistId/$id/")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    fior: typeof search["fior"] === "string" ? search["fior"] : undefined,
  }),
  loader: ({ params: { playlistId, id } }) => {
    let item = parseInt(id ?? "1");
    if (isNaN(item)) item = 1;
    if (item < 1) item = 1;
    return {
      playlistId,
      item,
    };
  },
});
