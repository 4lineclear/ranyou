import {
  Box,
  Editable,
  Flex,
  Float,
  Heading,
  IconButton,
} from "@chakra-ui/react";
import { ColorModeButton } from "@/components/ui/color-mode";
import {
  columnQuery,
  FiorData,
  FiorItem,
  Key,
  PlaylistData,
  Predicate,
  readPlaylistData,
  Search,
  Operators,
  PlItemKeys,
  IsolatedKeys,
  PlItemData,
  SortBy,
  Randomize,
  RandomSelect,
} from "@/lib/fior";
import { Button } from "@/components/ui/button";
import {
  MenuContent,
  MenuItem,
  MenuRoot,
  MenuTrigger,
} from "@/components/ui/menu";
import {
  DrawerBackdrop,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerRoot,
  DrawerTrigger,
} from "@/components/ui/drawer";

import { LuMenu, LuEllipsis, LuCheck, LuPlus, LuList, LuRefreshCw, LuPlay } from "react-icons/lu";

import { Link, useLocation } from "wouter";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { v4 } from "uuid";
import { Status } from "@/components/ui/status";
import RecordsContext from "@/AppContext";
import { EmptyState } from "@/components/ui/empty-state";
import TimeField from "react-simple-timefield";
import { Tag } from "@/components/ui/tag";
import { PlaylistItem } from "ranyou-shared/src";
import { Virtuoso } from "react-virtuoso";

import iso8601, { Duration } from "iso8601-duration";
import {
  NumberInputField,
  NumberInputRoot,
} from "@/components/ui/number-input";
import { randomString } from "@/lib/random";

const FiorContext = createContext<{
  items: FiorData;
  saveData: (data: FiorData) => void;
  playlistData: PlaylistData | "unloaded" | "failed";
}>({
  items: {
    columns: {},
  },
  saveData: () => { },
  playlistData: {},
});
const SaveContext = createContext<{
  save: () => void;
}>({
  save: () => { },
});

// type RCProps = Column & Row;
// type Column = {
//   column: string;
// };
// type Row = {
//   column: string;
//   row: string;
// };

const saveData = (data: FiorData) => {
  localStorage.setItem("fiorData", JSON.stringify(data));
};
// TODO: handle malformed data
const loadData = (): FiorData => {
  const stored = localStorage.getItem("fiorData");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      saveData({ columns: {} });
    }
  }
  return { columns: {} };
};

// const FiorButton = (props: ButtonProps) => {
//   return (
//     <Button
//       variant="surface"
//       {...props}
//     />
//   );
// };

type StatusValue = "success" | "error" | "warning" | "info";

const SearchRow = ({ not, search }: { not?: boolean; search: Search }) => {
  const { save } = useContext(SaveContext);
  const [regexStatus, setRegexStatus] = useState<StatusValue>("success");
  const timer = useRef<Timer>();
  const checkRegex = () => {
    if (!search.regex) return;
    try {
      RegExp(search.search);
      setRegexStatus("success");
    } catch {
      setRegexStatus("error");
    }
  };
  useEffect(checkRegex, [search]);
  const [cols, setCol] = useState<[Key, boolean][]>(() =>
    PlItemKeys.map((k) => [k, search.cols?.includes(k) ?? false]),
  );
  const colChange = (i: number) => () => {
    cols[i] = [cols[i][0], !cols[i][1]];
    search.cols = cols.filter((c) => c[1]).map((k) => k[0]);
    setCol([...cols]);
    save();
  };
  const filteredCols = () => {
    const c = cols.filter((k) => k[1]);
    if (c.length == 1) return c[0];
    else return c.length + " selected";
  };
  return (
    <Box gap="2" w="full">
      <Heading size="sm" mb="2">
        {not && "Exclude "}Search
      </Heading>
      <Flex position="relative" w="100%">
        <Editable.Root
          size="sm"
          value={search.search}
          onValueChange={(e) => {
            setRegexStatus("warning");
            search.search = e.value;
            clearTimeout(timer.current);
            timer.current = setTimeout(checkRegex, 500);
          }}
          width="full"
          border="solid 2px var(--chakra-colors-bg-emphasized)"
          rounded="sm"
        >
          <Editable.Preview></Editable.Preview>
          <Editable.Input></Editable.Input>
        </Editable.Root>
        <MenuRoot positioning={{ sameWidth: true }}>
          <MenuTrigger asChild>
            <Button w="35%" variant="surface" alignSelf="center">
              {filteredCols()}
            </Button>
          </MenuTrigger>
          <MenuContent minW="0">
            {PlItemKeys.map((c, i) => (
              <MenuItem
                key={c}
                value={c}
                justifyContent="center"
                bg={cols[i][1] ? "bg.emphasized" : undefined}
                onClick={colChange(i)}
              >
                {c}
              </MenuItem>
            ))}
          </MenuContent>
        </MenuRoot>
        {search.regex && (
          <Float>
            <Status value={regexStatus} />
          </Float>
        )}
      </Flex>
    </Box>
  );
};

const CheckRow = ({ not, check }: { not?: boolean; check: Predicate }) => {
  const { save } = useContext(SaveContext);
  const [value, setValue] = useState(useMemo(() => check.value, [check]));
  const [operator, setOperator] = useState(check.operator);
  const [cols, setCols] = useState<IsolatedKeys | undefined>(() => check.cols);
  const colChange = (k: Key) => () => {
    const newCols: Record<string, boolean> = { ...cols };
    if (cols) {
      if (PlItemData[k] === PlItemData[Object.keys(cols)[0] as Key]) {
        newCols[k] = !newCols[k];
        if (k === "duration" && !newCols[k]) setValue("");
        if (Object.values(newCols).every((v) => !v)) {
          setCols(undefined);
          check.cols = undefined;
        } else {
          setCols(newCols as IsolatedKeys);
          check.cols = newCols as IsolatedKeys;
        }
      }
    } else {
      const kind = PlItemData[k];
      Object.entries(PlItemData)
        .filter(([, v]) => v === kind)
        .map(([k]) => k as Key)
        .forEach((k) => (newCols[k] = false));
      newCols[k] = true;
      setCols(newCols as IsolatedKeys);
      check.cols = newCols as IsolatedKeys;
    }
    save();
  };
  const filteredCols = () => {
    const c = Object.entries(cols ?? {}).filter((k) => k[1]);
    if (c.length == 1) return c[0];
    else return c.length + " selected";
  };
  return (
    <Box gap="2" w="full">
      <Heading size="sm" mb="2">
        {not && "Exclude "}Check
      </Heading>
      <Flex w="full">
        <MenuRoot positioning={{ sameWidth: true }} closeOnSelect={false}>
          <MenuTrigger asChild>
            <Button h="inherit" w="40%" variant="outline">
              {filteredCols()}
            </Button>
          </MenuTrigger>
          <MenuContent minW="0">
            {PlItemKeys.map((c) => (
              <MenuItem
                key={c}
                value={c}
                justifyContent="center"
                bg={
                  cols && cols[c as keyof IsolatedKeys]
                    ? "bg.emphasized"
                    : undefined
                }
                onClick={colChange(c)}
                disabled={
                  Object.keys(cols ?? {}).length !== 0 &&
                  cols &&
                  cols[c as keyof IsolatedKeys] === undefined
                }
              >
                {c}
              </MenuItem>
            ))}
          </MenuContent>
        </MenuRoot>
        <MenuRoot positioning={{ sameWidth: true }}>
          <MenuTrigger asChild>
            <Button h="inherit" w="20%" variant="outline">
              {operator}
            </Button>
          </MenuTrigger>
          <MenuContent minW="0">
            {Operators.map((op) => (
              <MenuItem
                key={op}
                value={op}
                justifyContent="center"
                bg={operator === op ? "bg.emphasized" : undefined}
                onClick={() => {
                  check.operator = op;
                  setOperator(op);
                  save();
                }}
              >
                {op}
              </MenuItem>
            ))}
          </MenuContent>
        </MenuRoot>
        {cols && "duration" in cols ? (
          <Flex
            border="solid 1px var(--chakra-colors-bg-emphasized)"
            rounded="sm"
            ms="auto"
            w="40%"
          >
            <TimeField
              value={value.slice(2, -1).replace(/\D+/g, ":")}
              onChange={(_, nv) => {
                const parts = nv.split(":");
                check.value =
                  "PT" + parts[0] + "H" + parts[1] + "M" + parts[2] + "S";
                setValue(check.value);
                save();
              }}
              colon=":"
              showSeconds
              style={{
                textAlign: "center",
                border: "var(--chakra-colors-bg-empahsized)",
                background: "var(--chakra-colors-bg)",
                color: "var(--chakra-colors-fg)",
                width: "100%",
                padding: "5px 8px",
                borderRadius: "var(--charka-radii-sm)",
              }}
            />
          </Flex>
        ) : (
          <Editable.Root
            value={value}
            onValueChange={(e) => {
              check.value = e.value;
              setValue(e.value);
              save();
            }}
            border="solid 1px var(--chakra-colors-bg-emphasized)"
            rounded="sm"
            ms="auto"
            w="40%"
          >
            <Editable.Preview />
            <Editable.Input />
          </Editable.Root>
        )}
      </Flex>
    </Box>
  );
};

const OrderRow = ({ sort, rev }: { sort: SortBy; rev?: boolean }) => {
  const { save } = useContext(SaveContext);
  // const [cols, setCols] = useState<[Key, boolean][]>(() => PlItemKeys.map(k => [k, false]));
  const [cols, setCols] = useState<Key[]>(() =>
    PlItemKeys.filter((k) => sort.cols?.includes(k) ?? false),
  );
  return (
    <Box gap="2" w="full">
      <Heading size="sm" mb="2">
        {rev && "Reverse "}Sort
      </Heading>
      <Flex wrap="wrap" gap="1">
        {cols.map((k, i) => (
          <Tag
            p="2"
            key={k}
            size="lg"
            closable
            onClose={() => {
              cols.splice(i, 1);
              setCols([...cols]);
              sort.cols = cols;
              save();
            }}
            variant="outline"
          >
            {k}
          </Tag>
        ))}
        <MenuRoot closeOnSelect={false}>
          <MenuTrigger asChild>
            <IconButton variant="outline" h="inherit" minH="36px">
              <LuPlus />
            </IconButton>
          </MenuTrigger>
          <MenuContent minW="0">
            {PlItemKeys.filter((k) => !cols.includes(k)).map((k) => (
              <MenuItem
                key={k}
                value={k}
                justifyContent="center"
                onClick={() => {
                  cols.push(k as Key);
                  setCols([...cols]);
                  sort.cols = cols;
                  save();
                }}
              >
                {k}
              </MenuItem>
            ))}
          </MenuContent>
        </MenuRoot>
      </Flex>
    </Box>
  );
};

const RandomizeRow = ({
  random,
  rev,
}: {
  random: Randomize;
  rev?: boolean;
}) => {
  const { save } = useContext(SaveContext);
  const [rng, setRng] = useState(random.rngSeed);
  return (
    <Box gap="2" w="full">
      <Heading size="sm" mb="2">
        {rev && "Reverse "}Randomize
      </Heading>
      <Box
        border="solid 1px var(--chakra-colors-bg-emphasized)"
        rounded="sm"
      >
        <Flex wrap="wrap" gap="1">
          <Editable.Root
            value={rng}
            onValueChange={(r) => {
              setRng(r.value);
              random.rngSeed = r.value;
              save();
            }}
            size="lg"
          >
            <Editable.Preview />
            <Editable.Input />
            <Editable.Control ms="auto" onClick={() => {
              const r = randomString();
              setRng(r);
              random.rngSeed = r;
              save();

            }}>
              <IconButton variant="ghost">
                <LuRefreshCw />
              </IconButton>
            </Editable.Control>
          </Editable.Root>
        </Flex>
      </Box>
    </Box>
  );
};

const RandomSelectRow = ({
  not,
  random,
}: {
  not?: boolean;
  random: RandomSelect;
}) => {
  const { save } = useContext(SaveContext);
  const [rng, setRng] = useState(random.rngSeed);
  const [count, setCount] = useState(random.selectCount.toString());
  return (
    <Box gap="2" w="full">
      <Heading size="sm" mb="2">
        {not && "Exclude "}Random Select
      </Heading>
      <Flex wrap="wrap" gap="2%">
        <NumberInputRoot
          w="49%"
          value={count}
          onValueChange={(v) => {
            const n = parseInt(v.value);
            if (isNaN(n)) return;
            random.selectCount = n;
            setCount(v.value);
            save();
          }}
          h="full"
        >
          <NumberInputField
            mb="0"
          />
        </NumberInputRoot>
        <Box
          w="49%"
          border="solid 1px var(--chakra-colors-bg-emphasized)"
          rounded="sm"
        >
          <Editable.Root
            value={rng}
            onValueChange={(r) => {
              setRng(r.value);
              random.rngSeed = r.value;
              save();
            }}
          >
            <Editable.Preview>
            </Editable.Preview>
            <Editable.Input />
            <Editable.Control ms="auto" onClick={() => {
              const r = randomString();
              setRng(r);
              random.rngSeed = r;
              save();

            }}>
              <IconButton variant="ghost">
                <LuRefreshCw />
              </IconButton>
            </Editable.Control>
          </Editable.Root>
        </Box>
      </Flex>
    </Box>
  );
};

// TODO: add random selection

const EditorRow = ({
  column,
  row,
  reloadRows,
}: {
  reloadRows: () => void;
  column: string;
  row: string;
}) => {
  const { items } = useContext(FiorContext);
  const { save } = useContext(SaveContext);
  const [rowItem, setRowItem] = useState(items.columns[column].rows[row]);
  const reloadRow = () => {
    setRowItem({ ...rowItem });
    items.columns[column].rows[row] = rowItem;
    save();
  };
  return (
    <Flex
      w="full"
      border="solid 2px var(--chakra-colors-bg-emphasized)"
      alignItems="center"
      rounded="sm"
      p="2"
      position="relative"
    >
      {"order" in rowItem ? (
        "cols" in rowItem.order ? (
          <OrderRow sort={rowItem.order} rev={rowItem.rev} />
        ) : (
          <RandomizeRow random={rowItem.order} rev={rowItem.rev} />
        )
      ) : "search" in rowItem.filter ? (
        <SearchRow search={rowItem.filter} not={rowItem.not} />
      ) : "rngSeed" in rowItem.filter ? (
        <RandomSelectRow random={rowItem.filter} not={rowItem.not} />
      ) : (
        <CheckRow check={rowItem.filter} not={rowItem.not} />
      )}
      <MenuRoot>
        <MenuTrigger ms="auto" asChild>
          <Float offset="4">
            <IconButton variant="ghost" ms="auto">
              <LuEllipsis />
            </IconButton>
          </Float>
        </MenuTrigger>
        <MenuContent>
          {"filter" in rowItem ? (
            <>
              {"regex" in rowItem.filter && (
                <MenuItem
                  value="regex"
                  onClick={() => {
                    if ("regex" in rowItem.filter)
                      rowItem.filter.regex = !rowItem.filter.regex;
                    reloadRow();
                  }}
                >
                  Regex
                  {rowItem.filter.regex && (
                    <Box ms="auto">
                      <LuCheck />
                    </Box>
                  )}
                </MenuItem>
              )}
              <MenuItem
                value="exclude"
                onClick={() => {
                  rowItem.not = !rowItem.not;
                  reloadRow();
                }}
              >
                Exclude
                {rowItem.not && (
                  <Box ms="auto">
                    <LuCheck />
                  </Box>
                )}
              </MenuItem>
            </>
          ) : (
            <MenuItem
              value="reverse"
              onClick={() => {
                rowItem.rev = !rowItem.rev;
                reloadRow();
              }}
            >
              Reverse
              {rowItem.rev && (
                <Box ms="auto">
                  <LuCheck />
                </Box>
              )}
            </MenuItem>
          )}
          <MenuItem
            value="delete"
            color="fg.error"
            _hover={{ bg: "bg.error", color: "fg.error" }}
            onClick={() => {
              delete items.columns[column].rows[row];
              reloadRows();
            }}
          >
            Delete...
          </MenuItem>
        </MenuContent>
      </MenuRoot>
    </Flex>
  );
};

// TODO: create system that detect changes on the column level
const EditorColumn = ({
  column,
  reloadColumns,
}: {
  reloadColumns: () => void;
  column: string;
}) => {
  const [, navigate] = useLocation();
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
    setFiorStatus("warning");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (typeof playlistData !== "string") {
        const newPI = columnQuery({ data: colItem, playlists: playlistData });
        setRowOutput(Object.values(newPI).reduce((n, pi) => n + pi.length, 0));
        setFiorStatus("success");
        setPlaylistItems(newPI);
        // console.log(Object.values(o)[0].map(pi => pi.duration));
        // Object.values(o)
        //   .flatMap((pi) => pi)
        //   .forEach((pi) => console.log(pi.duration));
      }
    }, 500);
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
  const reloadRows = () => {
    setRows(Object.keys(colItem.rows));
    save();
  };
  const [title, setTitle] = useState(useMemo(() => colItem.name, [colItem]));
  const [playlists, setPlaylists] = useState<[string, boolean][]>(() =>
    Object.keys(records).map((pl) => [pl, colItem.records.includes(pl)]),
  );
  return (
    <SaveContext.Provider value={{ save }}>
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
              {Object.keys(records).length === 0 ? (
                <EmptyState
                  title="No playlists found."
                  description="Add some playlist to start!"
                />
              ) : (
                Object.values(records).map((pl, i) => (
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
                ))
              )}
            </MenuContent>
          </MenuRoot>
        </Flex>
        <Flex direction="column" gapY="1">
          {rows.map((row) => (
            <EditorRow
              key={row}
              column={column}
              row={row}
              reloadRows={reloadRows}
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
              <MenuItem
                value="search"
                onClick={() => {
                  addRow({
                    filter: {
                      cols: [],
                      search: "",
                      regex: false,
                    },
                    index: Object.keys(rows).length,
                  });
                }}
              >
                +Search
              </MenuItem>
              <MenuItem
                value="check"
                onClick={() => {
                  addRow({
                    filter: {
                      cols: undefined,
                      operator: "==",
                      value: "",
                    },
                    index: Object.keys(rows).length,
                  });
                }}
              >
                +Check
              </MenuItem>
              <MenuItem
                value="random-select"
                onClick={() => {
                  addRow({
                    filter: {
                      cols: [],
                      rngSeed: randomString(),
                      selectCount: 0,
                    },
                    index: Object.keys(rows).length,
                  });
                }}
              >
                +Random Select
              </MenuItem>
            </MenuContent>
          </MenuRoot>
          <MenuRoot positioning={{ sameWidth: true }}>
            <MenuTrigger asChild>
              <Button variant="surface" flexGrow="1">
                +Order
              </Button>
            </MenuTrigger>
            <MenuContent>
              <MenuItem
                value="sort"
                onClick={() => {
                  addRow({
                    order: {
                      cols: [],
                    },
                    index: Object.keys(rows).length,
                  });
                }}
              >
                +Sort
              </MenuItem>
              <MenuItem
                value="random"
                onClick={() => {
                  addRow({
                    order: {
                      rngSeed: randomString(),
                    },
                    index: Object.keys(rows).length,
                  });
                }}
              >
                +Random
              </MenuItem>
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
            <IconButton variant="surface" m="1" onClick={() => {
              navigate(`/play/${Object.keys(playlistItems).join('')}/`);
            }}>
              <LuPlay />
            </IconButton>
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
    </SaveContext.Provider>
  );
};

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

const Fior = () => {
  const { records } = useContext(RecordsContext);
  const items = useMemo(loadData, []);
  const [columns, setColumns] = useState(() => Object.keys(items.columns));
  const reloadColumns = () => {
    setColumns(Object.keys(items.columns));
    saveData(items);
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
        saveData,
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
