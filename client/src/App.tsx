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
        <RecordsContext.Provider value={recordProvider}>
          <Switch>
            <Route path="/">
              <MenuPage></MenuPage>
            </Route>
          </Switch>
        </RecordsContext.Provider>
      </Provider>
    </>
  );
};

export default App;
