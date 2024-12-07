import { Box, Flex, Float, Heading, IconButton, Input } from "@chakra-ui/react";
import { ColorModeButton } from "@/components/ui/color-mode";
import {
  Filter,
  FiorColumn,
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

enum RowAction {
  Add,
  Delete,
}

type RowUpdate = {
  column: string;
  row: string;
  action: RowAction;
  item?: FiorItem;
};

enum ColumnAction {
  Add,
  Delete,
  Rename,
}

type ColumnUpdate = {
  column: string;
  name: string;
  action: ColumnAction;
};

type Update = RowUpdate | ColumnUpdate;

type Stores = {
  updateAll: (columns: string[]) => void;
  columnStore: ColumnStoreSet;
};
type ColumnStoreSet = Record<string, [ColumnStore, (column: FiorColumn) => void]>;
type RowStoreSet = Record<string, (row: FiorItem) => void>;
type ColumnStore = {
  rowStore: RowStoreSet;
};

const rowUpdate = (stores: Stores, fior: FiorData, update: Update) => {
  const col = fior.columns.get(update.column);
  if (!col) return false;
  const colStore = stores.columnStore[update.column];
  if (update.action === RowAction.Add) {
    if (!update.item) return false;
    col.rows.set(update.row, update.item);
    colStore[0].rowStore[update.row](update.item);
    return true;
  }
  if (update.action === RowAction.Delete && col.rows.delete(update.row)) {
    if (update.item) colStore[1](col);
    return true;
  }
  return false;
};

const columnUpdate = (stores: Stores, fior: FiorData, update: Update) => {
  if (update.action === ColumnAction.Add) {
    fior.columns.set(update.column, {
      name: update.name,
      rows: new Map(),
    });
    stores.updateAll([...fior.columns.keys()]);
    return true;
  }
  if (
    update.action === ColumnAction.Delete &&
    fior.columns.delete(update.column)
  ) {
    stores.updateAll([...fior.columns.keys()]);
    return true;
  }
  if (update.action === ColumnAction.Rename) {
    const col = fior.columns.get(update.column);
    if (!col) return false;
    col.name = update.name;
    stores.columnStore[update.column][1](col);
    return true;
  }
  return false;
};

const applyUpdate = (
  stores: Stores,
  fior: FiorData,
  update: Update,
): boolean =>
  "row" in update
    ? rowUpdate(stores, fior, update)
    : columnUpdate(stores, fior, update);

const saveData = (data: FiorData) => {
  localStorage.setItem(
    "fiorData",
    JSON.stringify(data, (_, value) =>
      value instanceof Map
        ? {
          dataType: "Map",
          value: Array.from(value.entries()),
        }
        : value,
    ),
  );
};

const loadData = (): FiorData => {
  const stored = localStorage.getItem("fiorData");
  if (stored) {
    try {
      return JSON.parse(stored, (_, value) =>
        typeof value === "object" && value !== null && value.dataType === "Map"
          ? new Map(value.value)
          : value,
      );
    } catch {
      saveData({ columns: new Map() });
    }
  }
  return { columns: new Map() };
};

type AllProps = ItemProps & RCProps;

type ItemProps = {
  items: FiorData;
  update: (update: Update) => void;
};
type RCProps = ColumnProps & RowProps;
type ColumnProps = {
  column: string;
};
type RowProps = {
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
  update,
  search,
  column,
  row,
}: { search: Search } & AllProps) => {
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
            update({
              column,
              row,
              action: RowAction.Add,
              item: {
                filter: {
                  ...search,
                  search: e.currentTarget.value,
                },
              },
            });
            // setItems({ ...items });
          }}
        />
        <Checkbox
          ms="auto"
          variant="outline"
          checked={search.regex}
          onCheckedChange={(c) => {
            if (typeof c.checked === "boolean") {
              update({
                column,
                row,
                action: RowAction.Add,
                item: {
                  filter: {
                    ...search,
                    regex: c.checked,
                  },
                },
              });
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
  items,
  update,
  rowItem,
  column,
  row,
}: { rowItem: Filter } & AllProps) => {
  return "search" in rowItem.filter ? (
    <SearchRow
      search={rowItem.filter}
      items={items}
      update={update}
      column={column}
      row={row}
    />
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
  update,
  column,
  row,
  rowItem,
}: {
  rowItem: FiorItem;
} & AllProps) => {
  // const { items } = useContext(FiorContext);
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
        <FilterRow
          items={items}
          update={update}
          rowItem={rowItem}
          column={column}
          row={row}
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
          <MenuItem value="export">Export</MenuItem>
          <MenuItem
            value="delete"
            color="fg.error"
            _hover={{ bg: "bg.error", color: "fg.error" }}
            onClick={() => {
              update({
                column,
                row,
                action: RowAction.Delete,
              });
            }}
          >
            Delete...
          </MenuItem>
        </MenuContent>
      </MenuRoot>
    </Flex>
  );
};

const EditorColumn = ({
  items,
  update,
  colItem,
  column,
}: {
  colItem: FiorColumn;
  column: string;
} & ItemProps) => {
  const addFilter = () =>
    update({
      column,
      row: v4(),
      action: RowAction.Add,
      item: {
        filter: {
          cols: [],
          search: "",
        },
      },
    });
  const addOrder = () =>
    update({
      column,
      row: v4(),
      action: RowAction.Add,
      item: {
        order: {
          cols: ["position", "index"],
        },
      },
    });
  const renameRef = useRef<HTMLInputElement>(null);
  const [renameOpen, setRenameOpen] = useState(false);
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
                          update({
                            column,
                            name: renameRef.current?.value,
                            action: ColumnAction.Rename,
                          });
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
                          update({
                            column,
                            name: renameRef.current?.value,
                            action: ColumnAction.Rename,
                          });
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
                update({
                  column,
                  name: colItem.name,
                  action: ColumnAction.Delete,
                });
              }}
            >
              Delete...
            </MenuItem>
          </MenuContent>
        </MenuRoot>
      </Flex>
      <Flex gap="1" mb="2">
        <FiorButton flexGrow="1" onClick={() => addFilter()}>
          +Filter
        </FiorButton>
        <FiorButton flexGrow="1" onClick={() => addOrder()}>
          +Order
        </FiorButton>
      </Flex>
      <Flex direction="column" gapY="1">
        {[...colItem.rows.entries()].map(([row, rowItem]) => (
          <EditorRow
            key={row}
            rowItem={rowItem}
            column={column}
            row={row}
            items={items}
            update={update}
          />
        ))}
      </Flex>
    </Box>
  );
};

const EditorGrid = ({
  columns,
  items,
  update,
}: {
  columns: string[];
  setColumns: (columns: string[]) => void;
} & ItemProps) => {
  return (
    <Flex minH="full" h="fit-content" w="full" bg="bg.emphasized" p="3" gap="2">
      {columns.map((column) => (
        <EditorColumn
          key={column}
          colItem={items.columns.get(column)!}
          column={column}
          items={items}
          update={update}
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
  const [columns, setColumns] = useState(
    useMemo(() => [...items.columns.keys()], [items]),
  );
  const stores: Stores = useMemo(
    () => {
      const columnStore: ColumnStoreSet = {};
      for (const [column, colItem] of items.columns) {
        const rowStore: RowStoreSet = {};
        for (const [row, rowItem] of colItem.rows) {
          rowStore[row] = [];
        }
        columnStore[column] = [{ rowStore }, () => { }];
      }
      return ({
        updateAll: setColumns,
        columnStore,
      });
    },
    [items.columns],
  );
  const update = (update: Update) => {
    if (applyUpdate(stores, items, update)) saveData(items);
  };
  console.log(count++);
  const addColumnClick = () => {
    let i = items.columns
      .values()
      .filter(
        (col) =>
          col.name.startsWith("fior-") && !isNaN(parseInt(col.name.slice(5))),
      )
      .map((col) => parseInt(col.name.slice(5)))
      .toArray()
      .toSorted()
      .findIndex((n, i) => n !== i);
    if (i === -1) i = items.columns.size;
    update({
      column: v4(),
      name: "fior-" + i,
      action: ColumnAction.Add,
    });
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
          setColumns={setColumns}
          items={items}
          update={update}
        />
      </Box>
    </Flex>
    // <FiorContext.Provider value={{ items, update: update }}>
    // </FiorContext.Provider>
  );
};

export default Fior;
