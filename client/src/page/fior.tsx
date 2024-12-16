import { Box, Flex, Heading } from "@chakra-ui/react";
import { ColorModeButton } from "@/components/ui/color-mode";
import { loadFior, PlaylistData, readPlaylistData, saveFior } from "@/lib/fior";
import { Button } from "@/components/ui/button";

import { Link } from "wouter";

import { useContext, useEffect, useMemo, useState } from "react";

import { v4 } from "uuid";
import RecordsContext from "@/app-context";
import EditorColumn from "./fior/column";
import { FiorContext } from "./fior/context";

// TODO: add random selection

const EditorGrid = ({
  columns,
  reloadColumns,
}: {
  columns: string[];
  reloadColumns: () => void;
}) => {
  return (
    <Flex
      minH="full"
      h="fit-content"
      p="3"
      gap="2"
      border="solid 3px var(--chakra-colors-bg-emphasized)"
    >
      {columns.map((column) => (
        <EditorColumn
          key={column}
          column={column}
          reloadColumns={reloadColumns}
        />
      ))}
    </Flex>
  );
};

// TODO: move header to be it's own component

// TODO: consider moving from uuids to user-set names for columns

// TODO: setup proper record & item provider

// TODO: implement DRY

// TODO: break up this file

// TODO: fix saving system, probably use some state management library

// TODO: create proper data handling where indices are respected.

// TODO: fix various data races, maybe create a Loading class.

const Fior = () => {
  const { records } = useContext(RecordsContext);
  const items = useMemo(loadFior, []);
  const [columns, setColumns] = useState(() => Object.keys(items.columns));
  const reloadColumns = () => {
    setColumns(Object.keys(items.columns));
    saveFior(items);
  };
  const [playlistData, setPlaylistData] = useState<
    PlaylistData | "unloaded" | "failed"
  >("unloaded");

  useEffect(() => {
    readPlaylistData(records)
      .then((d) => setPlaylistData(d))
      .catch(() => setPlaylistData("failed"));
  }, [records]);

  return (
    <FiorContext.Provider
      value={{
        items,
        saveData: saveFior,
        playlistData,
      }}
    >
      <Flex w="full" h="100vh" direction="column" gap="2" p="2">
        <Flex alignItems="baseline" gap="3">
          <Heading textStyle="3xl">
            <Link href="/">ranyou</Link>
          </Heading>
          <Heading textStyle="2xl">fi(lter) or(der)</Heading>
          <ColorModeButton marginStart="auto" />
        </Flex>
        <Box>
          <Button
            variant="surface"
            onClick={() => {
              let i = Object.values(items.columns)
                .filter(
                  (col) =>
                    col.name.startsWith("fior-") &&
                    !isNaN(parseInt(col.name.slice(5))),
                )
                .map((col) => parseInt(col.name.slice(5)))
                .toSorted()
                .findIndex((n, i) => n !== i);
              if (i === -1) i = Object.keys(items.columns).length;
              items.columns[v4()] = {
                name: "fior-" + i,
                rows: {},
                records: [],
                index: Object.keys(items.columns).length,
              };
              reloadColumns();
            }}
          >
            +Column
          </Button>
        </Box>
        <Box h="vh">
          <EditorGrid columns={columns} reloadColumns={reloadColumns} />
        </Box>
      </Flex>
    </FiorContext.Provider>
  );
};

export default Fior;
