import { FormEvent, useContext, useState } from "react";
import { fetchRecords, PlaylistRecord } from "../lib/youtube";
import { useLocation } from "wouter";
import RecordsContext from "../AppContext";

// TODO: move to bootstrap

enum Message {
  PlaylistNotFound,
  InternalServerError,
  PlaylistAlreadyAdded,
  NoMessage,
}

function MessageComponent({ message }: { message: Message }) {
  let inner;
  switch (message) {
    case Message.PlaylistNotFound:
      inner = "Playlist Not Found";
      break;
    case Message.InternalServerError:
      inner = "Internal Server Error";
      break;
    case Message.PlaylistAlreadyAdded:
      inner = "Playlist Already Added";
      break;
    case Message.NoMessage:
    default:
      inner = null;
  }
  return inner ? <p>{inner}</p> : null;
}

function RecordItem({ i, pr }: { i: number; pr: PlaylistRecord }) {
  const [, setLocation] = useLocation();
  const onClick = (ev: React.MouseEvent) => {
    setLocation(`/${pr.playlist_id}`);
    console.log(ev);
  };
  // pr.playlist_id,
  // pr.published_at.toString(),
  // pr.channel_id,
  // pr.channel_title,
  // pr.title,
  // pr.description,
  // pr.privacy_status,
  // pr.thumbnail,
  // pr.playlist_length,
  const published_at = pr.published_at.toDateString();
  return (
    <li key={i} className="record-item" onClick={onClick}>
      <span className="record-title">{pr.title} </span>
      <span className="record-length">{pr.playlist_length} </span>
      <span className="record-published-at">{published_at} </span>
      <span className="record-channel-title">{pr.channel_title} </span>
      <span className="record-status">{pr.privacy_status}</span>
    </li>
  );
}

export default function MenuPage() {
  const [playlistId, setPlaylistId] = useState("");
  const [message, setMessage] = useState(Message.NoMessage);
  const { records, addRecord } = useContext(RecordsContext);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    fetchRecords(playlistId)
      .then((record: PlaylistRecord | number) => {
        if (typeof record === "number") {
          if (record === 400) setMessage(Message.PlaylistNotFound);
          if (record === 500) setMessage(Message.InternalServerError);
          return;
        }
        setMessage(Message.NoMessage);
        if (records[record.playlist_id]) {
          setMessage(Message.PlaylistAlreadyAdded);
          return;
        }
        addRecord(record);
      })
      .catch(console.log);
  };
  return (
    <div className="mate-regular">
      <div>
        <h1>Ran(dom) You(Tube)</h1>
      </div>
      <div>
        <form action="/" onSubmit={handleSubmit}>
          <label htmlFor="playlist-id">Playlist ID:</label>
          <input
            type="text"
            name="playlist-id"
            value={playlistId}
            onChange={(e) => setPlaylistId(e.target.value)}
            required
          />
          <MessageComponent message={message} />
          <input type="submit" value="Save" />
        </form>
      </div>
      <div>
        <ol>
          {Object.values(records).map((pr, i) => (
            <RecordItem key={i} i={i} pr={pr} />
          ))}
        </ol>
      </div>
    </div>
  );
}
