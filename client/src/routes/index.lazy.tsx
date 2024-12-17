import MenuPage from "@/page/menu";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/")({
  component: MenuPage,
});
