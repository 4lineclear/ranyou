import React from "react";
import { PlaylistRecord } from "./lib/youtube";

const RecordsContext = React.createContext<{
  records: Record<string, PlaylistRecord>;
  addRecord: (record: PlaylistRecord) => void;
}>({
  records: {},
  addRecord: () => {},
});
export default RecordsContext;
