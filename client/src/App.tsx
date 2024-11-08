import { useState } from "react";
import { Route, Switch } from "wouter";

import MenuPage from "./page/menu";
import PlayPage from "./page/play";

import RecordsContext from "./AppContext";
import { PlaylistRecord } from "./lib/youtube";

function readLocalRecords(): Record<string, PlaylistRecord> {
  const records: Record<string, PlaylistRecord> = JSON.parse(
    localStorage.getItem("ranyouRecords") ?? "[]",
  );
  for (const key in records) {
    records[key].published_at = new Date(records[key].published_at);
  }
  return records;
}

function writeLocalRecords(records: Record<string, PlaylistRecord>) {
  localStorage.setItem("ranyouRecords", JSON.stringify(records));
}

export default function App() {
  const [records, setRecords] = useState(readLocalRecords());
  const doWriteRecords = (record: PlaylistRecord) => {
    const newRecords = { ...records, [record.playlist_id]: record };
    setRecords(newRecords);
    writeLocalRecords(newRecords);
  };
  return (
    <>
      <Switch>
        <RecordsContext.Provider value={{ records, addRecord: doWriteRecords }}>
          <Route path="/">
            <MenuPage></MenuPage>
          </Route>
          <Route path="/:playlist-id">
            <PlayPage></PlayPage>
          </Route>
        </RecordsContext.Provider>
      </Switch>
    </>
  );
}
