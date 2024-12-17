import { useState } from "react";
import { Provider } from "@/components/ui/provider";
import {
  PlaylistRecord,
  PlaylistRecords,
  readLocalRecords,
  writeLocalRecords,
} from "@/lib/youtube";
import RecordsContext from "@/root-context";
import NotFound from "@/page/not-found";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFound,
});

function RootComponent() {
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
    <Provider>
      <RecordsContext.Provider value={recordProvider}>
        <Outlet />
        <TanStackRouterDevtools />
      </RecordsContext.Provider>
    </Provider>
  );
}
