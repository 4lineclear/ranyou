import PlayPage from "@/page/play";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/play/")({
  component: RouteComponent,
});

function RouteComponent() {
  const que = Route.useSearch();
  return (
    <PlayPage
      initItemIndex={que.index}
      playlistId={que.playlistId}
      fiorParam={que.fior}
    />
  );
}
