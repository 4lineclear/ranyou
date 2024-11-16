import React from "react";
import { PlaylistItem } from "@/lib/youtube";

export interface IPlayContext {
  playlistId: string;
  items: PlaylistItem[];
  itemIndex: number;
  setItemIndex: (n: number) => void;
}

const PlayContext = React.createContext<IPlayContext>({
  playlistId: "",
  items: [],
  itemIndex: 0,
  setItemIndex: () => {},
});

export default PlayContext;
