import {
  Box,
  Flex,
  Float,
  Grid,
  GridItem,
  Heading,
  IconButton,
  Input,
} from "@chakra-ui/react";
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
import FiorContext from "./fior-context";
import { Checkbox } from "@/components/ui/checkbox";

import { LuMenu, LuEllipsis } from "react-icons/lu";

import { Link } from "wouter";

import { useContext, useRef, useState } from "react";

import { v4 } from "uuid";

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

const SearchRow = ({ search }: { search: Search }) => {
  const { items, setItems } = useContext(FiorContext);
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
            setItems({ ...items });
          }}
        />
        <Checkbox
          ms="auto"
          variant="outline"
          checked={search.regex}
          onCheckedChange={(c) => {
            if (typeof c.checked === "boolean") {
              search.regex = c.checked;
              setItems({ ...items });
            }
          }}
        >
          regex
        </Checkbox>
      </Flex>
    </Box>
  );
};
const FilterRow = ({ rowItem }: { rowItem: Filter }) => {
  return "search" in rowItem.filter ? (
    <SearchRow search={rowItem.filter} />
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
  rowItem,
  col,
  row,
}: {
  rowItem: FiorItem;
  col: number;
  row: number;
}) => {
  const { items, setItems } = useContext(FiorContext);
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
        <FilterRow rowItem={rowItem} />
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
              items.columns[col].rows.splice(row, 1);
              setItems({ ...items });
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
  colItem,
  col,
}: {
  colItem: FiorColumn;
  col: number;
}) => {
  const { items, setItems } = useContext(FiorContext);
  const addFilter = (colItem: FiorColumn) => {
    colItem.rows.push({
      rowId: v4(),
      filter: {
        cols: [],
        search: "",
      },
    });
    setItems({ ...items });
  };
  const addOrder = (colItem: FiorColumn) => {
    colItem.rows.push({
      rowId: v4(),
      order: {
        cols: ["position", "index"],
      },
    });
    setItems({ ...items });
  };
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
                      placeholder={colItem.name}
                      ref={renameRef}
                      onKeyDown={(k) => {
                        if (k.key === "Enter" && renameRef.current?.value) {
                          colItem.name = renameRef.current?.value;
                          setItems({ ...items });
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
                          setItems({ ...items });
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
                items.columns.splice(col, 1);
                setItems({ ...items });
              }}
            >
              Delete...
            </MenuItem>
          </MenuContent>
        </MenuRoot>
      </Flex>
      <Flex gap="1" mb="2">
        <FiorButton flexGrow="1" onClick={() => addFilter(colItem)}>
          +Filter
        </FiorButton>
        <FiorButton flexGrow="1" onClick={() => addOrder(colItem)}>
          +Order
        </FiorButton>
      </Flex>
      <Flex direction="column" gapY="1">
        {colItem.rows.map((rowItem, row) => (
          <EditorRow
            key={rowItem.rowId}
            rowItem={rowItem}
            col={col}
            row={row}
          />
        ))}
      </Flex>
    </Box>
  );
};

const EditorGrid = () => {
  const { items } = useContext(FiorContext);
  return (
    <Flex minH="full" h="fit-content" w="full" bg="bg.emphasized" p="3" gap="2">
      {items.columns.map((colItem, col) => (
        <EditorColumn key={col} colItem={colItem} col={col} />
      ))}
    </Flex>
  );
};

const loadData = (): FiorData => {
  const stored = localStorage.getItem("fiorData");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      localStorage.setItem("fiorData", JSON.stringify({ columns: [] }));
    }
  }
  return { columns: [] };
};

const Fior = () => {
  const [items, setItems] = useState<FiorData>(loadData);
  const doSetItems = (newItems: FiorData) => {
    localStorage.setItem("fiorData", JSON.stringify(newItems));
    setItems(newItems);
  };
  const addColumnClick = () => {
    let i = items.columns
      .filter(
        (col) =>
          col.name.startsWith("fior-") && !isNaN(parseInt(col.name.slice(5))),
      )
      .map((col) => parseInt(col.name.slice(5)))
      .toSorted()
      .findIndex((n, i) => n !== i);
    if (i === -1) i = items.columns.length;
    items.columns.push({
      columnId: v4(),
      rows: [],
      name: "fior-" + i,
    });
    doSetItems({ ...items });
  };
  return (
    <FiorContext.Provider value={{ items, setItems: doSetItems }}>
      <Grid
        h="100vh"
        w="full"
        templateColumns="12% 75% 12%"
        templateRows="auto auto 1fr"
        gap="2"
      >
        <GridItem colSpan={3} display="flex" alignItems="baseline" gap="3">
          <Heading textStyle="3xl" ms="3">
            <Link href="/">ranyou</Link>
          </Heading>
          <Heading textStyle="2xl">fi(lter) or(der)</Heading>
          <ColorModeButton marginStart="auto" />
        </GridItem>
        <GridItem />
        <GridItem display="flex" gap="2">
          <FiorButton onClick={addColumnClick}>+Column</FiorButton>
        </GridItem>
        <GridItem />
        <GridItem />
        <GridItem>
          <EditorGrid />
        </GridItem>
        <GridItem />
      </Grid>
    </FiorContext.Provider>
  );
};

export default Fior;
