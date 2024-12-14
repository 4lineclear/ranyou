import { FiorData, PlaylistData } from "@/lib/fior";
import { createContext } from "react";

export const FiorContext = createContext<{
  items: FiorData;
  saveData: (data: FiorData) => void;
  playlistData: PlaylistData | "unloaded" | "failed";
}>({
  items: {
    columns: {},
  },
  saveData: () => { },
  playlistData: "unloaded",
});

export const SaveContext = createContext<{
  save: () => void;
}>({
  save: () => { },
});

