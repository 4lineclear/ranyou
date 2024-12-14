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
import { Redirect, Route, Switch } from "wouter";
import NotFound from "./page/not-found";
import PlayPage from "./page/play";
import Fior from "./page/fior";

// TODO: split up bundle size

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

  // TODO: check if play index is integer
  return (
    <>
      <Provider>
        <RecordsContext.Provider value={recordProvider}>
          <Switch>
            <Route path="/" component={MenuPage} />
            <Route path="/play/:playlist-id/:index?">
              {(params) =>
                parseInt(params.index ?? "1") < 1 ? (
                  <Redirect
                    to={"/play/" + params["playlist-id"] + "/1"}
                    replace
                  />
                ) : (
                  <PlayPage
                    initItemIndex={parseInt(params.index ?? "1")}
                    playlistId={params["playlist-id"]}
                  />
                )
              }
            </Route>
            <Route path="/fior/" component={Fior} />
            <Route component={NotFound} />
          </Switch>
        </RecordsContext.Provider>
      </Provider>
    </>
  );
};

export default App;
