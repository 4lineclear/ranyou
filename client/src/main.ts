import { runMenu } from "./pages/menu";
import runPlayer from "./pages/play";
import "./main.scss";

// TODO: create builder type

// TODO: see
// https://stackoverflow.com/questions/76690112/how-to-use-youtube-embed-api-in-svelte

const main = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const playlistId = urlParams.get("playlist-id");
  const app = document.querySelector<HTMLDivElement>("#app")!;
  const rerender = async () => {
    if (playlistId) {
      runPlayer(app, playlistId).catch((e) => alert("Error: " + e));
    } else {
      runMenu(app);
    }
  };
  rerender();
};

main();
