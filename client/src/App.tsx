import { useState } from "react";
import { Provider } from "./components/ui/provider";
import {
  PlaylistRecord,
  readLocalRecords,
  writeLocalRecords,
} from "./lib/youtube";
import MenuPage from "./page/menu";
import RecordsContext from "./AppContext";
import { Route, Switch } from "wouter";

const App = () => {
  const [records, setRecords] = useState(readLocalRecords());

  const recordProvider = {
    records,
    addRecord: (record: PlaylistRecord) => {
      const newRecords = { ...records, [record.playlist_id]: record };
      setRecords(newRecords);
      writeLocalRecords(newRecords);
    },
  };
  return (
    <>
      <Provider>
        <Switch>
          <RecordsContext.Provider value={recordProvider}>
            <Route path="/">
              <MenuPage></MenuPage>
            </Route>
          </RecordsContext.Provider>
        </Switch>
      </Provider>
    </>
  );
};

export default App;
