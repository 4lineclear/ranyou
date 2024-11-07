import { useEffect, useState } from "react";
import S from "./play.module.scss";
import randomize, { randomString } from "../lib/random";
import ReactPlayer from "react-player";
import { fetchItems, PlaylistItem } from "../lib/youtube";

// TODO: consider adding a mandatory id param to generated dom functions

// TODO: change from /?playlist-id={VAL} to /{VAL}

// TODO: add hide button for iframe

// TODO: stop blocking rendering.

// TODO: split up server api calls

// TODO: create reactive rendering system

// NOTE: it'd be cool if there was an algorithm to transform one shuffled
// list to another

// TODO: consider turning this into a proxy

// TODO: consider creating wrapper for react-player called playlist-player

function storedOrderCode() {
  const stored = localStorage.getItem("ranyouOrderCode");
  if (stored) return stored;
  const orderCode = randomString();
  localStorage.setItem("ranyouOrderCode", orderCode);
  return orderCode;
}

export default function PlayPage({ playlistId }: { playlistId: string }) {
  const [itemIndex, setItemIndex] = useState(0);
  const [orderCode, setOrderCode] = useState(storedOrderCode());
  const [offset, setOffset] = useState(0);
  const [items, setItems] = useState<PlaylistItem[]>([]);

  const shuffle = (code: string) => {
    items.sort((a, b) => a.position - b.position);
    randomize(code, items);
  };

  useEffect(() => { }, [items]);
  useEffect(() => {
    localStorage.setItem("ranyouOrderCode", orderCode);
    shuffle(orderCode);
    setItems(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderCode]);
  useEffect(() => {
    fetchItems(playlistId)
      .then((fetched) => {
        fetched.items.sort((a, b) => a.position - b.position);
        randomize(orderCode, fetched.items);
        setItems(fetched.items);
      })
      .catch(console.log);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const onScroll = () => setOffset(window.scrollY);
    // clean up code
    window.removeEventListener("scroll", onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div id={S.playPage}>
      <div id={S.title}>
        <h2>Ran(dom) You(Tube) playing '{playlistId}'</h2>
      </div>
      <div id={S.playerMain}>
        <div id={S.leftColumn} className={S.fixed}>
          <h3>edit list</h3>
          <hr />
          <div>
            <p>Order Code: {orderCode}</p>
            <button
              onClick={() => {
                const code = randomString();
                setOrderCode(code);
                shuffle(code);
              }}
            >
              Shuffle Playlist
            </button>
          </div>
        </div>
        <div id={S.middleColumn}>
          <div id={S.playerHolder}>
            {items[itemIndex] ? (
              <ReactPlayer
                // playing={true}
                controls={true}
                url={`https://www.youtube.com/watch?v=${items[itemIndex].video_id}`}
                width="100%"
                height="100%"
                onEnded={() => setItemIndex(itemIndex + 1)}
              />
            ) : null}
          </div>
          <div>
            <div id={S.nextUpTitle} className={S.fixed}>
              <h3>Next Up</h3>
            </div>
            <ol id={S.nextUp}>
              {items.map((item, i) => (
                <li key={i}>{item.title}</li>
              ))}
            </ol>
          </div>
        </div>
        <div id={S.rightColumn} className={S.fixed}>
          <h3>list stats</h3>
          <hr />
        </div>
      </div>
      <button
        id={S.scrollTop}
        onClick={() => window.scrollTo(0, 0)}
        className={offset !== 0 ? "" : S.hidden}
      ></button>
    </div>
  );
}
