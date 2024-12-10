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
  FiorData,
  FiorItem,
  Key,
  Predicate,
  PredicateOperator,
  runQuery,
  Search,
} from "@/lib/fior";
import { Button, ButtonProps } from "@/components/ui/button";
import {
  MenuContent,
  MenuItem,
  MenuRoot,
  MenuTrigger,
} from "@/components/ui/menu";

import { LuMenu, LuEllipsis, LuCheck } from "react-icons/lu";

import { Link } from "wouter";

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

const FiorContext = createContext<{
  items: FiorData;
  saveData: (data: FiorData) => void;
}>({
  items: {
    columns: {},
  },
  saveData: () => { },
});
const SaveContext = createContext<{
  save: () => void;
}>({
  save: () => { },
});

type RCProps = Column & Row;
type Column = {
  column: string;
};
type Row = {
  row: string;
};

const FiorButton = (props: ButtonProps) => {
  return (
    <Button
      bg="bg.emphasized"
      _active={{ bg: "bg.subtle" }}
      color="fg"
      {...props}
    />
  );
};

type StatusValue = "success" | "error" | "warning" | "info";

const filteredCols = (cols: [Key, boolean][]) => {
  const c = cols.filter((k) => k[1]);
  if (c.length == 1) return c[0];
  else return c.length + " selected";
};

const SearchRow = ({
  not,
  search,
  reloadRow,
}: {
  not?: boolean;
  search: Search;
  reloadRow: () => void;
}) => {
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
    colKeys.map((k) => [k, search.cols.includes(k)]),
  );
  const colChange = (i: number) => () => {
    cols[i] = [cols[i][0], !cols[i][1]];
    search.cols = cols.filter((c) => c[1]).map((k) => k[0]);
    setCol([...cols]);
    save();
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
            reloadRow();
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
              {filteredCols(cols)}
            </Button>
          </MenuTrigger>
          <MenuContent minW="0">
            {colKeys.map((c, i) => (
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

const operators: PredicateOperator[] = ["==", "!=", "<", ">", "<=", ">="];
const colKeys: Key[] = [
  "video_id",
  "title",
  "description",
  "note",
  "position",
  "channel_title",
  "channel_id",
  "duration",
  "added_at",
  "published_at",
];
const CheckRow = ({ not, check }: { not?: boolean; check: Predicate }) => {
  const { save } = useContext(SaveContext);
  const [value, setValue] = useState(useMemo(() => check.value, [check]));
  const [operator, setOperator] = useState(check.operator);
  const [cols, setCol] = useState<[Key, boolean][]>(() =>
    colKeys.map((k) => [k, check.cols.includes(k)]),
  );
  const colChange = (i: number) => () => {
    cols[i] = [cols[i][0], !cols[i][1]];
    check.cols = cols.filter((c) => c[1]).map((k) => k[0]);
    setCol([...cols]);
    save();
  };
  return (
    <Box gap="2" w="full">
      <Heading size="sm" mb="2">
        {not && "Exclude "}Check
      </Heading>
      <Flex w="full">
        <MenuRoot positioning={{ sameWidth: true }}>
          <MenuTrigger asChild>
            <Button h="inherit" w="40%" variant="outline">
              {filteredCols(cols)}
            </Button>
          </MenuTrigger>
          <MenuContent minW="0">
            {colKeys.map((c, i) => (
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
        <MenuRoot positioning={{ sameWidth: true }}>
          <MenuTrigger asChild>
            <Button h="inherit" w="20%" variant="outline">
              {operator}
            </Button>
          </MenuTrigger>
          <MenuContent minW="0">
            {operators.map((op) => (
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
        <Editable.Root
          value={value}
          onValueChange={(e) => {
            setValue(e.value);
            check.value = e.value;
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
      </Flex>
    </Box>
  );
};

const EditorRow = ({
  column,
  row,
  reloadRows,
}: { reloadRows: () => void } & RCProps) => {
  const { items } = useContext(FiorContext);
  const { save } = useContext(SaveContext);
  const [rowItem, setRowItem] = useState(items.columns[column].rows[row]);
  const reloadRow = () => {
    setRowItem({ ...rowItem });
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
        <>
          <span>order</span>
          {rowItem.order.cols.join(" ")}
        </>
      ) : "search" in rowItem.filter ? (
        <SearchRow
          search={rowItem.filter}
          reloadRow={reloadRow}
          not={rowItem.not}
        />
      ) : (
        <CheckRow
          check={rowItem.filter}
          // reloadRow={reloadRow}
          not={rowItem.not}
        />
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
          {"filter" in rowItem && (
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
} & Column) => {
  const [fiorStatus, setFiorStatus] = useState<StatusValue>("success");
  const timer = useRef<Timer>();
  const { items, saveData } = useContext(FiorContext);
  const { records } = useContext(RecordsContext);
  const colItem = items.columns[column];
  const save = () => {
    setFiorStatus("warning");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      runQuery({
        data: items,
        columns: [column],
        records,
      })
        .then(console.log)
        .catch((e) => {
          setFiorStatus("error");
          console.log(e);
        });
      // const items = Object.keys(items.columns).map()
      // fetchItems(playlistId)
      //   .then((items) => {
      //     let max = 0;
      //     let total = 0;
      //     for (const item of items) {
      //       const n = iso8601.toSeconds(iso8601.parse(item.duration));
      //       max = n > max ? n : max;
      //       total += n;
      //     }
      //     const mean = total / items.length;
      //     setDurationInfo({ max, mean });
      //     setItems(items);
      //     setShownItems(items.map(toShownItem));
      //     setLoading("loaded");
      //   })
      //   .catch((e) => {
      //     console.log(e);
      //     setLoading("failed");
      //   });
    }, 500);
    saveData(items);
  };
  useEffect(save, [column, items, records, saveData]);
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
                <LuMenu size="lg" />
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
        <Flex gap="1">
          <MenuRoot positioning={{ sameWidth: true }}>
            <MenuTrigger asChild>
              <FiorButton flexGrow="1">+Filter</FiorButton>
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
                      cols: [],
                      operator: "==",
                      value: "",
                    },
                    index: Object.keys(rows).length,
                  });
                }}
              >
                +Check
              </MenuItem>
            </MenuContent>
          </MenuRoot>
          <FiorButton
            flexGrow="1"
            onClick={() => {
              addRow({
                order: {
                  cols: [],
                },
                index: Object.keys(rows).length,
              });
            }}
          >
            +Order
          </FiorButton>
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
        <Flex
          mt="auto"
          w="full"
          p="2"
          justifyContent="center"
          bg="bg.emphasized"
          rounded="sm"
          position="relative"
        >
          <Float>
            <Status value={fiorStatus} />
          </Float>
        </Flex>
      </Flex>
    </SaveContext.Provider>
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

// TODO: consider moving from uuids to user-set names for columns

// TODO: setup proper record & item provider

const Fior = () => {
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
  const items = useMemo(loadData, []);
  const [columns, setColumns] = useState(() => Object.keys(items.columns));
  const reloadColumns = () => {
    setColumns(Object.keys(items.columns));
    saveData(items);
  };
  const addColumnClick = () => {
    let i = Object.values(items.columns)
      .filter(
        (col) =>
          col.name.startsWith("fior-") && !isNaN(parseInt(col.name.slice(5))),
      )
      .map((col) => parseInt(col.name.slice(5)))
      .toSorted()
      .findIndex((n, i) => n !== i);
    if (i === -1) i = Object.keys(items.columns).length;
    items.columns[v4()] = {
      name: "fior" + i,
      rows: {},
      records: [],
      index: Object.keys(items.columns).length,
    };
    reloadColumns();
  };
  return (
    <FiorContext.Provider
      value={{
        items,
        saveData,
      }}
    >
      <Flex w="full" h="100vh" direction="column" gap="2" p="1">
        <Flex alignItems="baseline" gap="3">
          <Heading textStyle="3xl">
            <Link href="/">ranyou</Link>
          </Heading>
          <Heading textStyle="2xl">fi(lter) or(der)</Heading>
          <ColorModeButton marginStart="auto" />
        </Flex>
        <Box>
          <FiorButton ms="3" onClick={addColumnClick}>
            +Column
          </FiorButton>
        </Box>
        <Box h="vh">
          <EditorGrid columns={columns} reloadColumns={reloadColumns} />
        </Box>
      </Flex>
    </FiorContext.Provider>
  );
};

export default Fior;
