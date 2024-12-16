import React from "react";
import { PlaylistRecord } from "./lib/youtube";

const RecordsContext = React.createContext<{
  records: Record<string, PlaylistRecord>;
  addRecord: (record: PlaylistRecord) => void;
  removeRecord: (id: string) => void;
}>({
  records: {},
  addRecord: () => {},
  removeRecord: () => {},
});
export default RecordsContext;
