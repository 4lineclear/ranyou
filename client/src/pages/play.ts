import {
  button,
  br,
  div,
  frag,
  h2,
  h3,
  hr,
  li,
  ol,
  p,
  script,
} from "../lib/common";
import randomize, { randomString } from "../lib/random";
import { fetchItems, PlaylistItem } from "../lib/youtube";
import S from "./play.module.scss";

// TODO: add hide button for iframe

// TODO: stop blocking rendering.

// TODO: split up server api calls

// NOTE: it'd be cool if there was an algorithm to transform one shuffled
// list to another

function getSeed() {
  const stored = localStorage.getItem("ranyouOrderSeed");
  if (stored) return stored;
  const seed = randomString();
  setSeed(seed);
  return seed;
}

function setSeed(seed: string) {
  localStorage.setItem("ranyouOrderSeed", seed);
}

let app: HTMLElement;

let seed = getSeed();
const ytPlayer = div({ id: "yt-player" });
const nextUp = ol({ id: S.nextUp });

let items: PlaylistItem[] = [];
let player: YT.Player | null = null;
let orderSeed = p();

function renderPlayerPage() {
  orderSeed.textContent = `Order Seed: ${seed}`;
  return div({ id: S.playPage }, [
    div({ id: S.title }, [h2({ innerText: "Ran(dom) You(Tube)" })]),
    div({ id: S.playerMain }, [
      div({ id: S.leftColumn, className: `${S.outerColumn}` }, [
        h3({ textContent: "edit list" }),
        hr(),
        div({}, [
          div({}, [
            orderSeed,
            button({
              // TODO: replace with emoji
              textContent: "Regen Seed",
              onclick: () => {
                seed = randomString();
                orderSeed.textContent = `Order Seed: ${seed}`;
                setSeed(seed);
                shuffleItems();
              },
            }),
          ]),
          br(),
        ]),
      ]),
      div({ id: S.middleColumn }, [
        div({ id: S.playerHolder }, [ytPlayer]),
        div({}, [
          div({ id: S.nextUpTitle }, [h3({ textContent: "Next up" })]),
          nextUp,
        ]),
      ]),
      div({ id: S.rightColumn, className: `${S.outerColumn}` }, [
        h3({ textContent: "list stats" }),
        hr(),
      ]),
    ]),
    button({
      id: S.scrollTop,
      onclick: () => window.scrollTo({ top: 0, behavior: "smooth" }),
    }),
  ]);
}

function onPlayerReady() {
  const piFrag = frag(...items.map((item) => li({ textContent: item.title })));
  player!.getIframe().hidden = false;
  document.querySelector("#app")!.classList.remove(S.loading);
  nextUp.replaceChildren(piFrag);

  const [left, right] = app.querySelectorAll<HTMLDivElement>(
    `.${S.outerColumn}`,
  );
  const nextUpTitle = app.querySelector<HTMLDivElement>(`#${S.nextUpTitle}`)!;

  const leftTop = left.offsetTop;
  const nextTop = nextUpTitle.offsetTop;

  window.onscroll = () => {
    [
      { i: nextTop, e: [nextUpTitle] },
      { i: leftTop, e: [left, right] },
    ].forEach((d) => {
      if (window.scrollY > d.i)
        d.e.forEach((node) => node.classList.add(S.fixed));
      else {
        d.e.forEach((node) => node.classList.remove(S.fixed));
      }
    });
  };
}

function load() {
  if (window.YT && window.YT.Player) {
    player = new window.YT.Player(ytPlayer.id, {
      playerVars: {
        enablejsapi: 1,
      },
      width: "100%",
      height: "100%",
      events: {
        onReady: onPlayerReady,
      },
    });
    player.getIframe().hidden = true;
  }
}

function setupPlayer() {
  document
    .querySelector("script")!
    .insertAdjacentElement(
      "beforebegin",
      script({ src: "https://www.youtube.com/iframe_api" }),
    );
  if (window.YT && window.YT.Player) {
    load();
  } else {
    (window as any).onYouTubeIframeAPIReady = () => load();
  }
}

export default async function runPlayer(
  newApp: HTMLDivElement,
  playlistId: string,
) {
  app = newApp;
  app.classList.add(S.loading);
  const fetched = await fetchItems(playlistId);
  items = fetched.items;
  shuffleItems();
  setupPlayer();
  app.replaceChildren(renderPlayerPage());
}

function shuffleItems() {
  items.sort((a, b) => a.position - b.position);
  randomize(seed, items);
}

// dexie
// lz-string
