import FiorPage from "@/page/fior";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/fior")({
  component: FiorPage,
});
