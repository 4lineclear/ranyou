import { createFileRoute } from "@tanstack/react-router";

type SearchParams = {
  fior?: string;
};

export const Route = createFileRoute("/play/$playlistId/")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    fior: typeof search["fior"] === "string" ? search["fior"] : undefined,
  }),
  loader: ({ params: { playlistId } }) => ({
    playlistId,
  }),
});
