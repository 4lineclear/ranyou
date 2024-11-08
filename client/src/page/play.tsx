import ReactPlayer from "react-player";
import { useParams } from "wouter";
import { useContext, useEffect, useState } from "react";
import randomize, { randomString } from "../lib/random";
import { fetchItems, PlaylistItem } from "../lib/youtube";
import RecordsContext from "../AppContext";

// TODO: add video lengths to api

// TODO: add hide button for video player

// TODO: split up server api calls

// TODO: create reactive rendering system

// NOTE: it'd be cool if there was an algorithm to transform one shuffled
// list to another

// TODO: consider turning this into a proxy

// TODO: consider creating wrapper for react-player called playlist-player

// TODO: rename class names to kebab case

function storedOrderCode() {
  const stored = localStorage.getItem("ranyouOrderCode");
  if (stored) return stored;
  const orderCode = randomString();
  localStorage.setItem("ranyouOrderCode", orderCode);
  return orderCode;
}

export default function PlayPage() {
  const params = useParams();
  const { records } = useContext(RecordsContext);
  const [itemIndex, setItemIndex] = useState(0);
  const [orderCode, setOrderCode] = useState(storedOrderCode());
  const [offset, setOffset] = useState(0);
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [record] = useState(records[params[0] ?? ""]);

  const PlaylistItem = ({ i, item }: { i: number; item: PlaylistItem }) => (
    <li
      className="playlist-item"
      key={i}
      onClick={() => {
        setItemIndex(i);
      }}
    >
      <span>{item.title}</span>
      <span>{i + 1}</span>
      <span>{i + 1}</span>
    </li>
  );
  const shuffle = (code: string) => {
    items.sort((a, b) => a.position - b.position);
    randomize(code, items);
  };

  useEffect(() => {}, [items]);
  useEffect(() => {
    localStorage.setItem("ranyouOrderCode", orderCode);
    shuffle(orderCode);
    setItems(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderCode]);
  useEffect(() => {
    fetchItems(record.playlist_id)
      .then((fetched) => {
        fetched.sort((a, b) => a.position - b.position);
        randomize(orderCode, fetched);
        setItems(fetched);
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
    <div id="play-page">
      <div id="title">
        <h2>Ran(dom) You(Tube) playing '{record.title}'</h2>
      </div>
      <div id="player-main">
        <div id="left-column" className="outer-column fixed">
          <h3>edit list</h3>
          <hr />
          <div>
            <p>Order Code: {orderCode}</p>
            <button
              onClick={() => {
                const code = randomString();
                setItemIndex(0);
                setOrderCode(code);
                shuffle(code);
              }}
            >
              Shuffle Playlist
            </button>
          </div>
        </div>
        <div id="middle-column">
          <div id="player-holder">
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
            <div id="next-up-title" className="fixed">
              <h3>Next Up</h3>
            </div>
            <ol id="next-up">
              {items.map((item, i) => (
                <PlaylistItem key={i} i={i} item={item} />
              ))}
            </ol>
          </div>
        </div>
        <div id="right-column" className="outer-column fixed">
          <h3>list stats</h3>
          <hr />
        </div>
      </div>
      <button
        id="scroll-top"
        onClick={() => window.scrollTo(0, 0)}
        className={offset !== 0 ? "" : "hidden"}
      ></button>
    </div>
  );
}
