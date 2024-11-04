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
  input,
} from "../lib/common";
import randomize, { randomString } from "../lib/random";
import { fetchItems, PlaylistItem } from "../lib/youtube";
import S from "./play.module.scss";

// TODO: consider adding a mandatory id param to generated dom functions

// TODO: change from /?playlist-id={VAL} to /{VAL}

// TODO: add hide button for iframe

// TODO: stop blocking rendering.

// TODO: split up server api calls

// TODO: create reactive rendering system

// NOTE: it'd be cool if there was an algorithm to transform one shuffled
// list to another

// TODO: consider turning this into a proxy

function writeNextUp() {
  nextUp.replaceChildren(
    frag(...items.map((item) => li({ textContent: item.title }))),
  );
  orderSeed.textContent = `Order Seed: ${seed}`;
}

function shuffleItems() {
  items.sort((a, b) => a.position - b.position);
  randomize(seed, items);
}

function getSeed() {
  const stored = localStorage.getItem("ranyouOrderSeed");
  if (stored) return stored;
  const seed = randomString();
  setSeed(seed);
  return seed;
}

function setSeed(newSeed: string) {
  seed = newSeed;
  localStorage.setItem("ranyouOrderSeed", newSeed);
}

let app: HTMLElement;

let seed = getSeed();

let ytPlayer: HTMLDivElement;
let ytPlayerHolder: HTMLDivElement;
let nextUp: HTMLOListElement;
let customSeedInput: HTMLInputElement;
let customSeedButton: HTMLButtonElement;

let items: PlaylistItem[] = [];
let player: YT.Player | null = null;
let orderSeed = p();

function renderPlayerPage() {
  orderSeed.textContent = `Order Seed: ${seed}`;
  customSeedInput = input({
    type: "text",
    onblur: () => {
      customSeedInput.replaceWith(customSeedButton);
      customSeedButton.textContent = "Custom Seed";
    },
    listeners: {
      keyup: {
        listener: (event) => {
          if (event.key !== "Enter") return;
          setSeed(customSeedInput.value);
          shuffleItems();
          writeNextUp();
          customSeedInput.blur();
        },
      },
    },
  });
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
              textContent: "Regen Seed",
              onclick: () => {
                setSeed(randomString());
                shuffleItems();
                writeNextUp();
              },
            }),
            button({
              textContent: "Custom Seed",
              onclick: () => {
                customSeedButton.textContent = null;
                customSeedButton.replaceWith(customSeedInput);
                customSeedInput.focus();
              },
              bind: (n) => (customSeedButton = n),
            }),
          ]),
          br(),
        ]),
      ]),
      div({ id: S.middleColumn }, [
        div(
          {
            id: S.playerHolder,
            className: S.hidden,
            bind: (n) => (ytPlayerHolder = n),
          },
          [div({ id: "yt-player", bind: (n) => (ytPlayer = n) })],
        ),
        div({}, [
          div({ id: S.nextUpTitle }, [h3({ textContent: "Next up" })]),
          ol({ id: S.nextUp, bind: (n) => (nextUp = n) }),
        ]),
      ]),
      // TODO: change to "view"
      div({ id: S.rightColumn, className: `${S.outerColumn}` }, [
        h3({ textContent: "list stats" }),
        hr(),
      ]),
    ]),
    button({
      id: S.scrollTop,
      className: S.hidden,
      onclick: () => window.scrollTo({ top: 0, behavior: "smooth" }),
    }),
  ]);
}

function onPlayerReady() {
  if (!player) return;
  player.cuePlaylist([...items.slice(0, 50).map((item) => item.video_id)]);
  ytPlayerHolder.classList.remove(S.hidden);
  // player.playVideo();
}

function setupScroll() {
  const [left, right] = app.querySelectorAll<HTMLDivElement>(
    `.${S.outerColumn}`,
  );
  const nextUpTitle = app.querySelector<HTMLButtonElement>(
    `#${S.nextUpTitle}`,
  )!;
  const scrollTop = app.querySelector<HTMLDivElement>(`#${S.scrollTop}`)!;

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
    if (window.scrollY == 0) {
      scrollTop.classList.add(S.hidden);
    } else {
      scrollTop.classList.remove(S.hidden);
    }
  };
}

function onStateChange(event: YT.OnStateChangeEvent) {
  switch (event.data) {
    case YT.PlayerState.UNSTARTED:
      break;
    case YT.PlayerState.ENDED:
      break;
    case YT.PlayerState.PLAYING:
      break;
    case YT.PlayerState.PAUSED:
      break;
    case YT.PlayerState.BUFFERING:
      break;
    case YT.PlayerState.CUED:
      break;
    default:
      break;
  }
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
        onStateChange: onStateChange,
      },
    });
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
  document.querySelector<HTMLMetaElement>(
    'meta[name="description"]',
  )!.content += ` playing ${playlistId}`;
  app = newApp;
  // TODO: run in parallel using Promise.all
  const fetched = await fetchItems(playlistId);
  items = fetched.items;
  shuffleItems();
  setupPlayer();
  app.replaceChildren(renderPlayerPage());
  setupScroll();
  writeNextUp();
}

// dexie
// lz-string
