import { label, form, frag, h1, input } from "../lib/common";

const renderMenuPage = () => {
  return frag(
    h1({ innerText: "Ran(dom) You(Tube)" }),
    form({}, [
      label({
        innerText: "Playlist ID",
        htmlFor: "playlist-id",
      }),
      input({ type: "text", name: "playlist-id" }),
      input({ type: "submit", value: "Play List" }),
    ]),
  );
};

export const runMenu = (app: HTMLDivElement) => {
  app.replaceChildren(renderMenuPage());
};
