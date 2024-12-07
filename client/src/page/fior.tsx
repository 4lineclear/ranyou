import {
  Box,
  Flex,
  Float,
  Heading,
  IconButton,
  Input,
} from "@chakra-ui/react";
import { ColorModeButton } from "@/components/ui/color-mode";
import { FiorData, FiorItem, Search } from "@/lib/fior";
import { Button, ButtonProps } from "@/components/ui/button";
import {
  DialogActionTrigger,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import {
  MenuContent,
  MenuItem,
  MenuRoot,
  MenuTrigger,
} from "@/components/ui/menu";
import { Checkbox } from "@/components/ui/checkbox";

import { LuMenu, LuEllipsis, LuCheck, LuRegex } from "react-icons/lu";

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

type IFiorContext = {
  items: FiorData;
};
const FiorContext = createContext<IFiorContext>({
  items: {
    columns: {},
  },
});

const saveData = (data: FiorData) => {
  localStorage.setItem("fiorData", JSON.stringify(data));
};

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

const SearchRow = ({
  not,
  search,
  reloadRow,
}: {
  not?: boolean;
  search: Search;
  reloadRow: () => void;
}) => {
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
  return (
    <Box gap="2" w="full">
      <Heading size="sm" mb="2">
        {not && "Exclude "}Search
      </Heading>
      <Flex gap="2" w="full">
        <Box position="relative">
          <Input
            size="sm"
            value={search.search}
            onInput={(e) => {
              setRegexStatus("warning");
              search.search = e.currentTarget.value;
              clearTimeout(timer.current);
              timer.current = setTimeout(checkRegex, 500);
              reloadRow();
            }}
          />
          {search.regex && (
            <Float>
              <Status value={regexStatus} />
            </Float>
          )}
        </Box>
        <Checkbox
          ms="auto"
          checked={search.regex}
          onCheckedChange={(c) => {
            if (typeof c.checked === "boolean") {
              search.regex = c.checked;
              reloadRow();
            }
          }}
          icon={<LuRegex />}
          size="lg"
        />
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
  const [rowItem, setRowItem] = useState(items.columns[column].rows[row]);
  const reloadRow = () => {
    setRowItem({ ...rowItem });
    saveData(items);
  };
  return (
    <Flex
      w="full"
      border="solid 2px"
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
        <Flex>
          <Heading>Check Filter</Heading>
          <span>{rowItem.filter.operator}</span>
        </Flex>
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

const ColumnMenuPopup = ({
  column,
  reloadColumns,
}: { reloadColumns: () => void } & Column) => {
  const { items } = useContext(FiorContext);
  const colItem = items.columns[column];
  const renameRef = useRef<HTMLInputElement>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  return (
    <DialogRoot
      initialFocusEl={() => renameRef.current}
      open={renameOpen}
      onOpenChange={(e) => setRenameOpen(e.open)}
    >
      <DialogTrigger asChild>
        <MenuItem value="rename">Rename</MenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename "{colItem.name}"</DialogTitle>
        </DialogHeader>
        <DialogBody pb="4">
          <Field label="Column Name">
            <Input
              defaultValue={colItem.name}
              placeholder={colItem.name}
              ref={renameRef}
              onKeyDown={(k) => {
                if (k.key === "Enter" && renameRef.current?.value) {
                  colItem.name = renameRef.current?.value;
                  reloadColumns();
                  setRenameOpen(false);
                }
              }}
            ></Input>
          </Field>
        </DialogBody>
        <DialogFooter>
          <DialogActionTrigger asChild>
            <Button variant="outline">Cancel</Button>
          </DialogActionTrigger>
          <DialogActionTrigger asChild>
            <Button
              onClick={() => {
                if (renameRef.current?.value) {
                  colItem.name = renameRef.current?.value;
                  reloadColumns();
                }
              }}
            >
              Save
            </Button>
          </DialogActionTrigger>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
};

const ColumnTitle = ({
  column,
  reloadColumns,
}: {
  reloadColumns: () => void;
} & Column) => {
  const { items } = useContext(FiorContext);
  return (
    <MenuRoot>
      <MenuTrigger ms="auto" asChild>
        <IconButton variant="ghost" p="1" size="lg">
          <LuMenu size="lg" />
        </IconButton>
      </MenuTrigger>
      <MenuContent>
        <ColumnMenuPopup column={column} reloadColumns={reloadColumns} />
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
  );
};

const EditorColumn = ({
  column,
  reloadColumns,
}: {
  reloadColumns: () => void;
} & Column) => {
  const { items } = useContext(FiorContext);
  const colItem = items.columns[column];
  const [rows, setRows] = useState(Object.keys(colItem.rows));
  const addRow = (rowItem: FiorItem) => {
    const row = v4();
    colItem.rows[row] = rowItem;
    setRows([...rows, row]);
  };
  const reloadRows = () => {
    setRows(Object.keys(colItem.rows));
    saveData(items);
  };
  return (
    <Box
      bg="bg"
      p="2"
      w="300px"
      position="relative"
      animation="fade-in 500ms ease-out"
    >
      <Flex mb="2" alignItems="center">
        <Heading>{colItem.name}</Heading>
        <ColumnTitle column={column} reloadColumns={reloadColumns} />
      </Flex>
      <Flex gap="1" mb="2">
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
                  },
                });
              }}
            >
              +Search
            </MenuItem>
            <MenuItem value="check">+Check</MenuItem>
          </MenuContent>
        </MenuRoot>
        <FiorButton
          flexGrow="1"
          onClick={() => {
            addRow({
              order: {
                cols: [],
              },
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
    </Box>
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
    <Flex minH="full" h="fit-content" w="full" bg="bg.emphasized" p="3" gap="2">
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

const Fior = () => {
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
    };
    reloadColumns();
  };
  return (
    <FiorContext.Provider value={{ items }}>
      <Flex w="full" h="100vh" direction="column" gap="2" p="1">
        <Flex alignItems="baseline" gap="3">
          <Heading textStyle="3xl">
            <Link href="/">ranyou</Link>
          </Heading>
          <Heading textStyle="2xl">fi(lter) or(der)</Heading>
          <ColorModeButton marginStart="auto" />
        </Flex>
        <Box>
          <FiorButton onClick={addColumnClick}>+Column</FiorButton>
        </Box>
        <Box w="full" h="full">
          <EditorGrid columns={columns} reloadColumns={reloadColumns} />
        </Box>
      </Flex>
    </FiorContext.Provider>
  );
};

export default Fior;
