import { FormEvent, useState } from "react";
// import { useLocation } from "wouter";
import { fetchRecords, PlaylistRecord } from "../lib/youtube";
import S from "./menu.module.scss";

// TODO: move to bootstrap

function readLocalRecords(): PlaylistRecord[] {
  return JSON.parse(localStorage.getItem("ranyouRecords") ?? "[]")
}
function writeLocalRecords(records: PlaylistRecord[]) { }

// const [, setLocation] = useLocation();
// setLocation(`/${playlistId}`);

export default function MenuPage() {
  const [playlistId, setPlaylistId] = useState("");
  const [showError, setShowError] = useState(false);
  const [records, setRecords] = useState(readLocalRecords());

  const handleRecord = (record: PlaylistRecord | number) => {
    if (typeof record === "number") {
      if (record === 400) setShowError(true);
      return;
    }
    setShowError(false);
  };
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    fetchRecords(playlistId).then(handleRecord).catch(console.log);
  };
  return (
    <div id={S.menuPage}>
      <div id={S.title}>
        <h1>Ran(dom) You(Tube)</h1>
      </div>
      <div id={S.formHolder}>
        <form id={S.form} action="/" onSubmit={handleSubmit}>
          <label id={S.inputLabel} htmlFor="playlist-id">
            Playlist ID:
          </label>
          <input
            id={S.input}
            type="text"
            name="playlist-id"
            value={playlistId}
            onChange={(e) => setPlaylistId(e.target.value)}
            required
          />
          {showError ? (
            <div id={S.invalidPlaylistId}>
              <p>Playlist Not Found</p>
            </div>
          ) : null}
          <input
            id={S.submit}
            type="submit"
            value="Save"
          />
        </form>
      </div>
      <div id={S.recordsHolder}>
      </div>
    </div>
  );
}
