import PlayPage from "@/page/play";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/play/$playlistId/")({
  component: RouteComponent,
});

function RouteComponent() {
  const loc = Route.useLoaderData();
  const que = Route.useSearch();
  return (
    <PlayPage
      initItemIndex={1}
      playlistId={loc.playlistId}
      fiorParam={que.fior}
    />
  );
}
