import "./style.css";
import frag from "./frag";

// TODO: create builder type
//
// TODO: see
// https://stackoverflow.com/questions/76690112/how-to-use-youtube-embed-api-in-svelte

const title = () => {
  const title = document.createElement("h1");
  title.innerText = "Ran(dom) You(Tube)";
  return title;
};

const form = () => {
  return frag().add(document.createElement("label")).toElement("form");
};

const renderMenuPage = () => {
  return frag().add(title).add(form).toElement("div");
};

const renderPlayerPage = () => {
  return frag().add(title).toElement("div");
};

`<div id="menu">
        <h1>Ran(dom) You(Tube)</h1>
        <form action="/">
          <label for="playlist-id">Playlist ID</label>
          <input type="text" name="playlist-id" />
          <input type="submit" value="Play List" />
        </form>
      </div>
`;
const main = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const playlistId = urlParams.get("playlist-id");
  const app = document.querySelector<HTMLDivElement>("#app")!;
  if (playlistId) {
    window.onload = () => {
      app.replaceChildren(renderPlayerPage());
    };
  } else {
    window.onload = () => {
      app.replaceChildren(renderMenuPage());
    };
  }
};

if (
  window.matchMedia &&
  window.matchMedia("(prefers-color-scheme: dark)").matches
) {
  document.body.classList.add("dark");
}

main();

// document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
//   <div>
//     <h1>Ran(dom) You(Tube)</h1>
//     <form>
//     </form>
//   </div>
// `;

// {
//   "name": "ranyou",
//   "private": true,
//   "version": "0.0.0",
//   "type": "module",
//   "scripts": {
//     "dev": "vite",
//     "build": "tsc && vite build",
//     "preview": "vite preview"
//   },
//   "devDependencies": {
//     "@types/youtube": "^0.1.0",
//     "typescript": "^5.5.3",
//     "vite": "^5.4.8"
//   },
//   "dependencies": {
//     "dexie": "^4.0.8",
//     "fast-shuffle": "^6.1.0",
//     "lz-string": "^1.5.0"
//   }
// }
