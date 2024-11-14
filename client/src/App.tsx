import { useState } from "react";
import { Provider } from "./components/ui/provider";
import {
  PlaylistRecord,
  PlaylistRecords,
  readLocalRecords,
  writeLocalRecords,
} from "./lib/youtube";
import MenuPage from "./page/menu";
import RecordsContext from "./AppContext";
import { Route, Switch } from "wouter";
import NotFound from "./page/not-found";
import PlayPage from "./page/play";

const App = () => {
  const [records, setRecords] = useState(readLocalRecords());

  const recordProvider = {
    records,
    addRecord: (record: PlaylistRecord) => {
      const newRecords = { ...records, [record.playlist_id]: record };
      setRecords(newRecords);
      writeLocalRecords(newRecords);
    },
    removeRecord: (id: string) => {
      const newRecords: PlaylistRecords = {};
      for (const key in records) if (key !== id) newRecords[key] = records[key];
      setRecords(newRecords);
      writeLocalRecords(newRecords);
    },
  };
  return (
    <>
      <Provider>
        <RecordsContext.Provider value={recordProvider}>
          <Switch>
            <Route path="/">
              <MenuPage></MenuPage>
            </Route>
            <Route path="/:playlist-id">
              {(params) => <PlayPage playlistId={params["playlist-id"]} />}
            </Route>
            <Route>
              <NotFound></NotFound>
            </Route>
          </Switch>
        </RecordsContext.Provider>
      </Provider>
    </>
  );
};

export default App;
