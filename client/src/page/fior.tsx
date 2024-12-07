import { Box, Flex, Float, Heading, IconButton, Input } from "@chakra-ui/react";
import { ColorModeButton } from "@/components/ui/color-mode";
import {
  Filter,
  FiorColumn,
  // FiorColumn,
  FiorData,
  FiorItem,
  Order,
  Search,
} from "@/lib/fior";
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

import { LuMenu, LuEllipsis } from "react-icons/lu";

import { Link } from "wouter";

import { useMemo, useRef, useState } from "react";

import { v4 } from "uuid";

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

type AllProps = Items & RCProps;

type Items = {
  items: FiorData;
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

const SearchRow = ({
  search,
  reloadRow,
}: {
  search: Search;
  reloadRow: () => void;
}) => {
  return (
    <Box gap="2" w="full">
      <Heading size="sm" mb="2">
        Search Filter
      </Heading>
      <Flex gap="2" w="full">
        <Input
          size="sm"
          value={search.search}
          onInput={(e) => {
            search.search = e.currentTarget.value;
            reloadRow();
          }}
        />
        <Checkbox
          ms="auto"
          variant="outline"
          checked={search.regex}
          onCheckedChange={(c) => {
            if (typeof c.checked === "boolean") {
              search.regex = c.checked;
              reloadRow();
            }
          }}
        >
          regex
        </Checkbox>
      </Flex>
    </Box>
  );
};
const FilterRow = ({
  rowItem,
  reloadRow,
}: {
  rowItem: Filter;
  reloadRow: () => void;
}) => {
  return "search" in rowItem.filter ? (
    <SearchRow search={rowItem.filter} reloadRow={reloadRow} />
  ) : (
    <Flex>
      <Heading>Search Filter</Heading>
      <span>{rowItem.filter.operator}</span>
    </Flex>
  );
};
const OrderRow = ({ rowItem }: { rowItem: Order }) => {
  return (
    <>
      <span>order</span>
      {rowItem.order.cols.join(" ")}
    </>
  );
};

const EditorRow = ({
  items,
  column,
  row,
  reloadRows,
}: { reloadRows: () => void } & AllProps) => {
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
        <OrderRow rowItem={rowItem} />
      ) : (
        <FilterRow rowItem={rowItem} reloadRow={reloadRow} />
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
          <MenuItem value="export">Export</MenuItem>
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

const ColumnTitle = ({
  items,
  column,
  reloadColumns,
  colItem,
}: {
  reloadColumns: () => void;
  colItem: FiorColumn;
} & Items &
  Column) => {
  const renameRef = useRef<HTMLInputElement>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  return (
    <MenuRoot>
      <MenuTrigger ms="auto" asChild>
        <IconButton variant="ghost">
          <LuMenu />
        </IconButton>
      </MenuTrigger>
      <MenuContent>
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
  items,
  column,
  reloadColumns,
}: {
  reloadColumns: () => void;
} & Items &
  Column) => {
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
        {/* TODO: work on the below */}
        <ColumnTitle
          items={items}
          column={column}
          colItem={colItem}
          reloadColumns={reloadColumns}
        />
      </Flex>
      <Flex gap="1" mb="2">
        <FiorButton flexGrow="1" onClick={() => {
          addRow({
            filter: {
              cols: [],
              search: "",
            },
          });
          reloadRows();
        }}>
          +Filter
        </FiorButton>
        <FiorButton flexGrow="1" onClick={() => {
          addRow({
            order: {
              cols: [],
            },
          });
          reloadRows();
        }}>
          +Order
        </FiorButton>
      </Flex>
      <Flex direction="column" gapY="1">
        {rows.map((row) => (
          <EditorRow
            key={row}
            column={column}
            row={row}
            items={items}
            reloadRows={reloadRows}
          />
        ))}
      </Flex>
    </Box>
  );
};

const EditorGrid = ({
  columns,
  items,
  reloadColumns,
}: {
  columns: string[];
  reloadColumns: () => void;
} & Items) => {
  return (
    <Flex minH="full" h="fit-content" w="full" bg="bg.emphasized" p="3" gap="2">
      {columns.map((column) => (
        <EditorColumn
          key={column}
          column={column}
          items={items}
          reloadColumns={reloadColumns}
        />
      ))}
    </Flex>
  );
};

let count = 0;

// TODO: consider moving from uuids to user-set names for columns

// TODO: currently each setItems call rerenders the entire fior block,
// need to find a way to not rerender on each input

const Fior = () => {
  const items = useMemo(loadData, []);
  const [columns, setColumns] = useState(() => Object.keys(items.columns));
  const reloadColumns = () => {
    setColumns(Object.keys(items.columns));
    saveData(items);
  };
  console.log(count++);
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
        <EditorGrid
          columns={columns}
          // setColumns={setColumns}
          items={items}
          reloadColumns={reloadColumns}
        />
      </Box>
    </Flex>
    // <FiorContext.Provider value={{ items, update: update }}>
    // </FiorContext.Provider>
  );
};

export default Fior;
