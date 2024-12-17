import { Box, Editable, Flex, Float, For, IconButton } from "@chakra-ui/react";
import {
  columnQuery,
  FiorItem,
  Predicate,
  Search,
  SortBy,
  Randomize,
  RandomSelect,
  StatusValue,
} from "@/lib/fior";
import { Button } from "@/components/ui/button";
import {
  MenuContent,
  MenuItem,
  MenuRoot,
  MenuTrigger,
} from "@/components/ui/menu";
import { LuList, LuMenu, LuPlay } from "react-icons/lu";

// import { useLocation } from "wouter";

import { useContext, useEffect, useMemo, useRef, useState } from "react";

import { v4 } from "uuid";
import { Status } from "@/components/ui/status";
import RecordsContext from "@/root-context";
import { EmptyState } from "@/components/ui/empty-state";
import { PlaylistItem } from "ranyou-shared/src";

import { randomString } from "@/lib/random";

import iso8601, { Duration } from "iso8601-duration";
import {
  DrawerBackdrop,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerRoot,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Virtuoso } from "react-virtuoso";
import { FiorContext } from "./context";
import { ColumnContext } from "./column/context";
import EditorRow from "./row";
import { Link } from "@tanstack/react-router";

type ShownItem = PlaylistItem & {
  index: number;
};

const toShownItem = (pi: PlaylistItem, index: number): ShownItem => ({
  ...pi,
  index,
});

const displayDuration = (d: Duration) => {
  const dMS = d.minutes + ":" + d.seconds?.toString().padStart(2, "0");
  return d.hours ? d.hours + ":" + dMS.padStart(5, "0") : dMS;
};

const parseDuration = (s: string) => {
  try {
    return iso8601.parse(s);
  } catch {
    return undefined;
  }
};

const ItemRow = ({ index, item }: { index: number; item: ShownItem }) => {
  const duration = parseDuration(item.duration);
  if (!duration) return;
  const durationStr = displayDuration(duration);
  return (
    <>
      <Flex
        cursor="pointer"
        key={index}
        p="3"
        justifyContent="space-between"
        borderY="1px solid gray"
        _active={{
          backgroundColor: "gray.emphasized",
          backgroundImage: "none",
        }}
      >
        <span>{item.title}</span>
        <span>{durationStr}</span>
      </Flex>
    </>
  );
};

const ListDrawer = ({
  title,
  items,
}: {
  title: string;
  items: PlaylistItem[];
}) => {
  // useEffect(() => console.log(items), [items]);
  return (
    <DrawerRoot size="md">
      <DrawerTrigger asChild>
        <IconButton variant="surface" m="1">
          <LuList />
        </IconButton>
      </DrawerTrigger>
      <DrawerBackdrop />
      <DrawerContent>
        <DrawerHeader>{"Inspecting '" + title + "' output."}</DrawerHeader>
        <DrawerBody>
          <Virtuoso
            data={items.map(toShownItem)}
            itemContent={(i, d) => <ItemRow index={i} item={d} />}
          />
        </DrawerBody>
      </DrawerContent>
    </DrawerRoot>
  );
};

const filterData: Record<string, () => RandomSelect | Search | Predicate> = {
  "+Search": () => ({
    cols: [],
    search: "",
    regex: false,
  }),
  "+Check": () => ({
    cols: undefined,
    operator: "==",
    value: "",
  }),
  "+Random Select": () => ({
    cols: [],
    rngSeed: randomString(),
    selectCount: 0,
  }),
};

const orderData: Record<string, () => SortBy | Randomize> = {
  "+Sort": () => ({
    cols: [],
  }),
  "+Randomise": () => ({
    rngSeed: randomString(),
  }),
};

// TODO: create system that detect changes on the column level
const EditorColumn = ({
  column,
  reloadColumns,
}: {
  reloadColumns: () => void;
  column: string;
}) => {
  // const [, navigate] = useLocation();
  const [rowOutput, setRowOutput] = useState(0);
  const [fiorStatus, setFiorStatus] = useState<StatusValue>("success");
  const [playlistItems, setPlaylistItems] = useState<
    Record<string, PlaylistItem[]>
  >({});
  const { items, saveData, playlistData } = useContext(FiorContext);
  const { records } = useContext(RecordsContext);
  const colItem = items.columns[column];
  const timer = useRef<Timer>();
  const save = () => {
    const handlePlData = () => {
      if (typeof playlistData !== "string") {
        const newPI = columnQuery({ data: colItem, playlists: playlistData });
        setRowOutput(Object.values(newPI).reduce((n, pi) => n + pi.length, 0));
        setFiorStatus("success");
        setPlaylistItems(newPI);
      }
    };
    setFiorStatus("warning");
    clearTimeout(timer.current);
    timer.current = setTimeout(handlePlData, 500);
    saveData(items);
  };
  useEffect(save, [items, saveData, playlistData, colItem]);
  const [rows, setRows] = useState(Object.keys(colItem.rows));
  const addRow = (rowItem: FiorItem) => {
    const row = v4();
    colItem.rows[row] = rowItem;
    setRows([...rows, row]);
    save();
  };
  const [title, setTitle] = useState(useMemo(() => colItem.name, [colItem]));
  const [playlists, setPlaylists] = useState<[string, boolean][]>(() =>
    Object.keys(records).map((pl) => [pl, colItem.records.includes(pl)]),
  );
  return (
    <ColumnContext.Provider value={{ save }}>
      <Flex
        bg="bg"
        p="2"
        w="300px"
        position="relative"
        animation="fade-in 500ms ease-out"
        rounded="md"
        direction="column"
        border="solid 2px var(--chakra-colors-bg-emphasized)"
        gap="2"
      >
        <Flex alignItems="center">
          <Editable.Root
            value={title}
            onValueChange={(e) => {
              colItem.name = e.value;
              setTitle(colItem.name);
              save();
            }}
            size="lg"
          >
            <Editable.Preview />
            <Editable.Input />
          </Editable.Root>
          <MenuRoot>
            <MenuTrigger ms="auto" asChild>
              <IconButton variant="ghost" p="1" size="lg">
                <LuMenu />
              </IconButton>
            </MenuTrigger>
            <MenuContent>
              <MenuItem value="export">Export</MenuItem>
              <MenuItem
                value="delete"
                color="fg.error"
                _hover={{ bg: "bg.error", color: "fg.error" }}
                onClick={() => {
                  delete items.columns[column];
                  Object.values(items.columns).forEach((r, i) => (r.index = i));
                  reloadColumns();
                }}
              >
                Delete...
              </MenuItem>
            </MenuContent>
          </MenuRoot>
        </Flex>
        <Flex>
          <MenuRoot positioning={{ sameWidth: true }}>
            <MenuTrigger asChild>
              <Button w="full" mx="auto" variant="outline" alignSelf="center">
                {(() => {
                  const c = playlists.filter((k) => k[1]);
                  if (c.length == 1) return records[c[0][0]].title;
                  else return c.length + " selected";
                })()}
              </Button>
            </MenuTrigger>
            <MenuContent minW="0">
              <For
                each={Object.values(records)}
                fallback={
                  <EmptyState
                    title="No playlists found."
                    description="Add some playlist to start!"
                  />
                }
              >
                {(pl, i) => (
                  <MenuItem
                    key={pl.playlist_id}
                    value={pl.playlist_id}
                    onClick={() => {
                      playlists[i] = [playlists[i][0], !playlists[i][1]];
                      colItem.records = playlists
                        .filter((c) => c[1])
                        .map((k) => k[0]);
                      setPlaylists([...playlists]);
                      save();
                    }}
                    bg={playlists[i][1] ? "bg.emphasized" : undefined}
                  >
                    {pl.title + " - " + pl.channel_title}
                  </MenuItem>
                )}
              </For>
            </MenuContent>
          </MenuRoot>
        </Flex>
        <Flex direction="column" gapY="1">
          {rows
            .toSorted((a, b) => colItem.rows[a].index - colItem.rows[b].index)
            .map((row) => (
              <EditorRow
                key={row}
                column={column}
                row={row}
                reloadRows={() => {
                  setRows([...Object.keys(colItem.rows)]);
                  save();
                }}
              />
            ))}
        </Flex>
        <Flex gap="1">
          <MenuRoot positioning={{ sameWidth: true }}>
            <MenuTrigger asChild>
              <Button variant="surface" flexGrow="1">
                +Filter
              </Button>
            </MenuTrigger>
            <MenuContent>
              {Object.entries(filterData).map(([s, v]) => (
                <MenuItem
                  key={s}
                  value={s}
                  onClick={() =>
                    addRow({
                      filter: v(),
                      index: Object.keys(rows).length,
                    })
                  }
                >
                  {s}
                </MenuItem>
              ))}
            </MenuContent>
          </MenuRoot>
          <MenuRoot positioning={{ sameWidth: true }}>
            <MenuTrigger asChild>
              <Button variant="surface" flexGrow="1">
                +Order
              </Button>
            </MenuTrigger>
            <MenuContent>
              {Object.entries(orderData).map(([s, v]) => (
                <MenuItem
                  key={s}
                  value={s}
                  onClick={() =>
                    addRow({
                      order: v(),
                      index: Object.keys(rows).length,
                    })
                  }
                >
                  {s}
                </MenuItem>
              ))}
            </MenuContent>
          </MenuRoot>
        </Flex>
        <Box
          mt="auto"
          w="full"
          position="relative"
          bg="bg.emphasized"
          rounded="sm"
        >
          <Flex justifyContent="space-between" alignItems="center">
            <Link
              to="/play/$playlistId/$id"
              params={{ playlistId: Object.keys(records).join(), id: "1" }}
              search={{ fior: column }}
            >
              <IconButton variant="surface" m="1">
                <LuPlay />
              </IconButton>
            </Link>
            Rows: {rowOutput}
            <ListDrawer
              title={colItem.name}
              items={Object.values(playlistItems).flatMap((pi) => pi)}
            />
          </Flex>
          <Float>
            <Status value={fiorStatus} />
          </Float>
        </Box>
      </Flex>
    </ColumnContext.Provider>
  );
};

export default EditorColumn;
