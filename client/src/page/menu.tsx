import { FormEvent, useState } from "react";
import { useLocation } from "wouter";

export default function MenuPage() {
  const [playlistId, setPlaylistId] = useState("");
  const [, setLocation] = useLocation();
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLocation(`/${playlistId}`);
  };
  return (
    <>
      <h1>Ran(dom) You(Tube)</h1>
      <form action="/" onSubmit={handleSubmit}>
        <label htmlFor="playlist-id">Playlist ID: </label>
        <input
          type="text"
          name="playlist-id"
          value={playlistId}
          onChange={(e) => setPlaylistId(e.target.value)}
          required
        />
        <input type="submit" value="Play List" />
      </form>
    </>
  );
}
