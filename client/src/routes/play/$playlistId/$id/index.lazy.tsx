import PlayPage from "@/page/play";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/play/$playlistId/$id/")({
  component: RouteComponent,
});

function RouteComponent() {
  const loc = Route.useLoaderData();
  const que = Route.useSearch();
  return (
    <PlayPage
      initItemIndex={loc.item}
      playlistId={loc.playlistId}
      fiorParam={que.fior}
    />
  );
}
