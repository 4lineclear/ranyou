import {
  Box,
  Editable,
  Flex,
  Float,
  Heading,
  IconButton,
} from "@chakra-ui/react";
import {
  Key,
  Predicate,
  Search,
  Operators,
  PlItemKeys,
  IsolatedKeys,
  PlItemData,
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
import { LuEllipsis, LuCheck, LuPlus, LuRefreshCw } from "react-icons/lu";

import { useContext, useEffect, useMemo, useRef, useState } from "react";

import { Status } from "@/components/ui/status";
import TimeField from "react-simple-timefield";
import { Tag } from "@/components/ui/tag";

import {
  NumberInputField,
  NumberInputRoot,
} from "@/components/ui/number-input";
import { randomString } from "@/lib/random";
import { FiorContext } from "./context";
import { ColumnContext } from "./column/context";

const Row = ({
  title,
  children,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
}) => {
  return (
    <Box w="full">
      <Heading size="sm" mb="2">
        {title}
      </Heading>
      {children}
    </Box>
  );
};

const SearchRow = ({ not, search }: { not?: boolean; search: Search }) => {
  const { save } = useContext(ColumnContext);
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
    <Row title={not ? "Exclude Search" : "Search"}>
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
          roundedLeft="sm"
        >
          <Editable.Preview></Editable.Preview>
          <Editable.Input></Editable.Input>
        </Editable.Root>
        <MenuRoot positioning={{ sameWidth: true }}>
          <MenuTrigger asChild>
            <Button
              w="35%"
              variant="surface"
              alignSelf="center"
              roundedLeft="none"
            >
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
    </Row>
  );
};

const CheckRow = ({ not, check }: { not?: boolean; check: Predicate }) => {
  const { save } = useContext(ColumnContext);
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
    <Row title={not ? "Excldue Check" : "Check"}>
      <Flex w="full">
        <MenuRoot positioning={{ sameWidth: true }} closeOnSelect={false}>
          <MenuTrigger asChild>
            <Button h="inherit" w="40%" variant="outline" roundedRight="none">
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
            <Button
              h="inherit"
              w="20%"
              variant="subtle"
              rounded="0"
              borderY="1px solid var(--chakra-colors-bg-emphasized)"
            >
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
        <Flex
          border="solid 1px var(--chakra-colors-bg-emphasized)"
          rounded="sm"
          roundedLeft="none"
          w="40%"
        >
          {cols && "duration" in cols ? (
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
                border: "var(--chakra-colors-bg-emphasized)",
                background: "var(--chakra-colors-bg)",
                color: "var(--chakra-colors-fg)",
                width: "100%",
                padding: "5px 8px",
                borderRadius: "var(--chakra-radii-sm)",
                borderTopLeftRadius: "var(--chakra-radii-none)",
                borderBottomLeftRadius: "var(--chakra-radii-none)",
              }}
            />
          ) : (
            <Editable.Root
              value={value}
              onValueChange={(e) => {
                check.value = e.value;
                setValue(e.value);
                save();
              }}
              roundedLeft="none"
            >
              <Editable.Preview />
              <Editable.Input />
            </Editable.Root>
          )}
        </Flex>
      </Flex>
    </Row>
  );
};

const OrderRow = ({ sort, rev }: { sort: SortBy; rev?: boolean }) => {
  const { save } = useContext(ColumnContext);
  const [cols, setCols] = useState<Key[]>(() =>
    PlItemKeys.filter((k) => sort.cols?.includes(k) ?? false),
  );
  return (
    <Row title={rev ? "Reverse Sort" : "Sort"}>
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
    </Row>
  );
};

const RandomizeRow = ({
  random,
  rev,
}: {
  random: Randomize;
  rev?: boolean;
}) => {
  const { save } = useContext(ColumnContext);
  const [rng, setRng] = useState(random.rngSeed);
  return (
    <Row title={rev ? "Reverse Randomize" : "Randomize"}>
      <Box border="solid 1px var(--chakra-colors-bg-emphasized)" rounded="sm">
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
            <Editable.Control
              ms="auto"
              onClick={() => {
                const r = randomString();
                setRng(r);
                random.rngSeed = r;
                save();
              }}
            >
              <IconButton variant="ghost">
                <LuRefreshCw />
              </IconButton>
            </Editable.Control>
          </Editable.Root>
        </Flex>
      </Box>
    </Row>
  );
};

const RandomSelectRow = ({
  not,
  random,
}: {
  not?: boolean;
  random: RandomSelect;
}) => {
  const { save } = useContext(ColumnContext);
  const [rng, setRng] = useState(random.rngSeed);
  const [count, setCount] = useState(random.selectCount.toString());
  return (
    <Row title={not ? "Exclude Random Select" : "RandomSelect"}>
      <Flex wrap="wrap" gap="2%">
        <NumberInputRoot
          w="49%"
          value={count}
          onValueChange={(v) => {
            const n = parseInt(v.value === "" ? "0" : v.value);
            if (isNaN(n)) return;
            random.selectCount = n;
            setCount(v.value);
            save();
          }}
          h="full"
        >
          <NumberInputField mb="0" />
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
            <Editable.Preview></Editable.Preview>
            <Editable.Input />
            <Editable.Control
              ms="auto"
              onClick={() => {
                const r = randomString();
                setRng(r);
                random.rngSeed = r;
                save();
              }}
            >
              <IconButton variant="ghost">
                <LuRefreshCw />
              </IconButton>
            </Editable.Control>
          </Editable.Root>
        </Box>
      </Flex>
    </Row>
  );
};

// TODO: add random selection

const EditorRow = ({
  column,
  row,
  reloadRows,
}: {
  column: string;
  row: string;
  reloadRows: () => void;
}) => {
  const { items } = useContext(FiorContext);
  const { save } = useContext(ColumnContext);
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
      {/* TODO: break this up into the seperate row componenets
                Probably best to move generic version to row.
      */}
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
                    if (!("regex" in rowItem.filter)) return;
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
              Object.values(items.columns[column].rows).forEach(
                (r, i) => (r.index = i),
              );
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

export default EditorRow;
