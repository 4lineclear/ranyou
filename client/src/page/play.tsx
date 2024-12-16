import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Spinner,
  Text,
  Heading,
  VStack,
  Box,
  Center,
  Flex,
  Group,
  Input,
  AbsoluteCenter,
  LinkOverlay,
  Grid,
  GridItem,
} from "@chakra-ui/react";
import { EmptyState } from "@/components/ui/empty-state";
import { ColorModeButton } from "@/components/ui/color-mode";

import ReactPlayer from "react-player";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";

import RecordsContext from "@/app-context";
import { fetchItems, fetchRecords, PlaylistItem } from "@/lib/youtube";

import iso8601, { Duration } from "iso8601-duration";
import { Link, useLocation, useSearch } from "wouter";
import { Switch } from "@/components/ui/switch";
import { Toaster, toaster } from "@/components/ui/toaster";
import {
  BreadcrumbCurrentLink,
  BreadcrumbLink,
  BreadcrumbRoot,
} from "@/components/ui/breadcrumb";
import {
  MenuContent,
  MenuItem,
  MenuRoot,
  MenuTrigger,
} from "@/components/ui/menu";
import { LuChevronDown } from "react-icons/lu";
import { columnQuery, loadFior } from "@/lib/fior";

export interface IPlayContext {
  playlistId: string;
  /** 0 based index */
  gotoIndex: (i: number) => void;
  items: PlaylistItem[];
  itemIndex: number;
  setItemIndex: (n: number) => void;
}

const PlayContext = createContext<IPlayContext>({
  playlistId: "",
  gotoIndex: () => {},
  items: [],
  itemIndex: 0,
  setItemIndex: () => {},
});

// import { randomString } from "@/lib/random";
// function storedOrderCode() {
//   const stored = localStorage.getItem("ranyouOrderCode");
//   if (stored) return stored;
//   const orderCode = randomString();
//   localStorage.setItem("ranyouOrderCode", orderCode);
//   return orderCode;
// }

type ShownItem = PlaylistItem & {
  index: number;
};

const toShownItem = (pi: PlaylistItem, index: number): ShownItem => ({
  ...pi,
  index,
});

// TODO: mess with layout a bit

// TODO: try using etags to detect changes

// TODO: deduplicate before saving on server

// video_id: string;
// title: string;
// description: string;
// note: string;
// position: number;
// channel_title: string;
// channel_id: string;
// duration: number;
// added_at: Date;
// published_at: Date;

const displayDuration = (d: Duration) => {
  const dMS = d.minutes + ":" + d.seconds?.toString().padStart(2, "0");
  return d.hours ? d.hours + ":" + dMS.padStart(5, "0") : dMS;
};

// function getQueryVariable(variable: string) {
//   const query = window.location.search.substring(1);
//   const vars = query.split("&");
//   for (let i = 0; i < vars.length; i++) {
//     const pair = vars[i].split("=");
//     if (decodeURIComponent(pair[0]) == variable) {
//       return decodeURIComponent(pair[1]);
//     }
//   }
//   console.log("Query variable %s not found", variable);
// }

const useGetQuery = (v: string): [string | null] => {
  const queryString = useSearch();
  const [query, setQuery] = useState<string | null>(null);
  useEffect(() => {
    const vars = queryString.split("&");
    for (let i = 0; i < vars.length; i++) {
      const pair = vars[i].split("=");
      if (decodeURIComponent(pair[0]) == v)
        setQuery(decodeURIComponent(pair[1]));
    }
  }, [queryString, v]);
  return [query];
};

const ItemRow = ({
  index,
  item,
  durationStat,
  virtuoso,
}: {
  index: number;
  item: ShownItem;
  durationStat: number;
  virtuoso: React.RefObject<VirtuosoHandle>;
}) => {
  const { itemIndex, items, gotoIndex } = useContext(PlayContext);
  const duration = iso8601.parse(item.duration);
  const durationStr = displayDuration(duration);
  const durationS = iso8601.toSeconds(duration);
  let perc = Math.ceil((100 * durationS) / durationStat);
  if (durationS >= durationStat) perc = 100;
  let bgImage =
    "linear-gradient(270deg, " +
    `var(--chakra-colors-bg) 0%, ` +
    `var(--chakra-colors-bg-emphasized) ${perc}%, ` +
    `rgba(0,0,0,0) ${perc}%)`;
  let fgColor;
  let bgColor;
  if (item.index === itemIndex) {
    fgColor = "bg.suble";
    bgColor = "fg.muted";
    bgImage = "none";
  }
  return (
    <Flex
      p="3"
      cursor="pointer"
      justifyContent="space-between"
      borderY="1px solid gray"
      backgroundImage={bgImage}
      color={fgColor}
      backgroundColor={bgColor}
      _active={{
        backgroundColor: "gray.emphasized",
        backgroundImage: "none",
      }}
      onClick={() => {
        gotoIndex(item.index);
        const behavior =
          Math.abs(index - itemIndex) < items.length / 100 ? "smooth" : "auto";
        virtuoso.current?.scrollToIndex({ index: index, behavior });
      }}
    >
      <span>{item.title}</span>
      <span>{durationStr}</span>
    </Flex>
  );
};

// function cleanRegexInput(s: string) {
//   return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
// }

const SearchList = ({
  setShownItems,
}: {
  setShownItems: (i: ShownItem[]) => void;
}) => {
  const { items } = useContext(PlayContext);
  const [search, setSearch] = useState("");
  const [searchTitle, setSearchTitle] = useState(true);
  const [searchDesc, setSearchDesc] = useState(false);

  const searchItems = (needle: string, st: boolean, sd: boolean) =>
    items.map(toShownItem).filter((v) => {
      if (!st && !sd) return items.slice();
      const search = (haystack: string) =>
        haystack.toLowerCase().includes(needle.trim().toLowerCase());
      if (st && search(v.title)) return true;
      if (sd && search(v.description)) return true;
      return false;
    });

  // NOTE: can use timer here in case performance is lacking
  return (
    <>
      <Input
        size="lg"
        placeholder="Search"
        value={search}
        onChange={(e) => {
          const needle = e.target.value;
          const filtered = searchItems(needle, searchTitle, searchDesc);
          setShownItems(filtered);
          setSearch(needle);
        }}
      />
      <Group mt="2" gap="2">
        <Switch
          checked={searchTitle}
          onCheckedChange={(c) => {
            setSearchTitle(c.checked);
            setShownItems(searchItems(search, c.checked, searchDesc));
          }}
        >
          Title
        </Switch>
        <Switch
          checked={searchDesc}
          onCheckedChange={(c) => {
            setSearchDesc(c.checked);
            setShownItems(searchItems(search, searchTitle, c.checked));
          }}
        >
          Description
        </Switch>
      </Group>
    </>
  );
};

const Player = () => {
  const [playing, setPlaying] = useState(false);
  const { items, itemIndex, gotoIndex } = useContext(PlayContext);
  if (items.length <= itemIndex)
    return (
      <Center h="full">
        <EmptyState
          title="This playlist doesn't have any videos"
          description="Choose another playlist to start!"
        />
      </Center>
    );
  return (
    <ReactPlayer
      playing={playing}
      controls={true}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
      }}
      url={`https://www.youtube.com/watch?v=${items[itemIndex].video_id}`}
      width="100%"
      height="100%"
      onPlay={() => setPlaying(true)}
      onEnded={() => gotoIndex(itemIndex)}
      onError={() => {
        toaster.create({
          title: "error playing video",
          type: "error",
          action: {
            label: "close",
            onClick: () => {},
          },
        });
        gotoIndex(itemIndex);
      }}
    />
  );
};

const Crumbs = () => {
  const { records } = useContext(RecordsContext);
  const { playlistId } = useContext(PlayContext);

  const playlist = records[playlistId] ?? { playlist_id: "", title: "unknown" };

  return (
    <BreadcrumbRoot separator="/" separatorGap="2" alignSelf="center" mt="2">
      <MenuRoot highlightedValue={playlist.playlist_id}>
        <MenuTrigger asChild>
          <BreadcrumbLink as="button">
            PlayLists <LuChevronDown />
          </BreadcrumbLink>
        </MenuTrigger>
        <MenuContent>
          {Object.values(records).map((pr) => (
            <MenuItem
              key={pr.playlist_id}
              cursor="pointer"
              value={pr.playlist_id}
              asChild
            >
              <Link href={"/play/" + pr.playlist_id}>{pr.title}</Link>
            </MenuItem>
          ))}
        </MenuContent>
      </MenuRoot>
      <BreadcrumbCurrentLink>{playlist.title}</BreadcrumbCurrentLink>
    </BreadcrumbRoot>
  );
};

const calcDurationInfo = (items: PlaylistItem[]) => {
  let max = 0;
  let total = 0;
  for (const item of items) {
    const n = iso8601.toSeconds(iso8601.parse(item.duration));
    max = n > max ? n : max;
    total += n;
  }
  const mean = total / items.length;
  return { max, mean };
};

const useItems = (playlistId: string) => {
  const [durationInfo, setDurationInfo] = useState({ max: 0, mean: 0 });
  const [loading, setLoading] = useState<"loading" | "loaded" | "failed">(
    "loading",
  );
  const { records, addRecord } = useContext(RecordsContext);
  const [fiorParam] = useGetQuery("fior");
  const fiorColumn = useMemo(
    () => (fiorParam ? loadFior().columns[fiorParam] : null),
    [fiorParam],
  );
  const [original, setOriginal] = useState<PlaylistItem[]>([]);
  const [shownItems, setShownItems] = useState<ShownItem[]>([]);

  // TODO: add useEffect cancellations using AbortController
  // to reduce data races.
  useEffect(() => {
    const ac = new AbortController();
    if (!records[playlistId]) {
      fetchRecords(playlistId, { signal: ac.signal }).then((record) => {
        if (!(record instanceof Response)) addRecord(record);
      });
    }
    fetchItems(playlistId, { signal: ac.signal })
      .then((items) => {
        setDurationInfo(calcDurationInfo(items));
        setOriginal(items);
        setLoading("loaded");
      })
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setLoading("failed");
      });
    return () => ac.abort();
  }, [playlistId, records, addRecord]);
  const items: PlaylistItem[] = useMemo(() => {
    if (fiorColumn)
      return columnQuery({
        data: fiorColumn,
        playlists: {
          [playlistId]: [records[playlistId], original.slice()],
        },
      })[playlistId];
    return original.slice();
  }, [fiorColumn, original, playlistId, records]);
  useEffect(() => setShownItems(items.map(toShownItem)), [items]);
  return { loading, items, durationInfo, shownItems, setShownItems };
};

// TODO: make init item index optional
const PlayPage = ({
  initItemIndex,
  playlistId,
}: {
  initItemIndex: number;
  playlistId: string;
}) => {
  const [, navigate] = useLocation();
  const [fiorParam] = useGetQuery("fior");
  const fiorColumn = useMemo(
    () => (fiorParam ? loadFior().columns[fiorParam] : null),
    [fiorParam],
  );
  const [itemIndex, setItemIndex] = useState(initItemIndex - 1);
  const { loading, items, durationInfo, shownItems, setShownItems } =
    useItems(playlistId);

  const virtuoso = useRef<VirtuosoHandle>(null);
  const gotoIndex = (i: number) => {
    setItemIndex(i);
    const fParam = fiorParam ? `?fior=${fiorParam}` : "";
    navigate(`/play/${playlistId}/${++i}` + fParam);
  };

  const playProvider: IPlayContext = {
    playlistId,
    items,
    gotoIndex,
    itemIndex,
    setItemIndex,
  };
  useEffect(() => console.log(loading), [loading]);

  if (loading === "failed")
    return (
      <LinkOverlay asChild>
        <Link href="/">
          <AbsoluteCenter>
            <VStack>
              <Text fontSize="3xl" color="lightslategray">
                Failed To Load
              </Text>
              <Text>Click anywhere to go home</Text>
            </VStack>
          </AbsoluteCenter>
        </Link>
      </LinkOverlay>
    );

  if (loading === "loading")
    return (
      <AbsoluteCenter h="full">
        <VStack>
          <Spinner size="xl" />
          <Heading size="2xl">Loading...</Heading>
        </VStack>
      </AbsoluteCenter>
    );

  const currentItem = items[itemIndex];

  return (
    <PlayContext.Provider value={playProvider}>
      <Grid
        h="100vh"
        gap="1"
        autoRows="auto 1fr"
        templateColumns="repeat(3, 1fr)"
      >
        <GridItem colSpan={2} display="flex" alignItems="center">
          <Heading textStyle="3xl" mx="3">
            <Link href="/">ranyou</Link>
          </Heading>
          <Crumbs />
        </GridItem>
        <GridItem colSpan={1} display="flex" alignItems="baseline">
          <Heading textStyle="xl">
            <Link href="/fior/">fior</Link>
          </Heading>
          {fiorColumn && (
            <Heading size="md" ms="2">
              {fiorColumn.name}
            </Heading>
          )}
          <ColorModeButton marginStart="auto" />
        </GridItem>
        <GridItem colSpan={2} position="relative" aspectRatio={16 / 9}>
          <Player />
        </GridItem>
        <GridItem colSpan={1}>
          <Virtuoso
            ref={virtuoso}
            data={shownItems}
            initialTopMostItemIndex={itemIndex}
            itemContent={(i, d) => (
              <ItemRow
                index={i}
                item={d}
                durationStat={durationInfo.mean}
                virtuoso={virtuoso}
              />
            )}
          />
        </GridItem>
        <GridItem colSpan={1} display="flex">
          <Box>
            <Text textStyle="xl">{currentItem?.title ?? "unknown"}</Text>
            <Text textStyle="md">
              {currentItem?.channel_title ?? "unknown"}
            </Text>
          </Box>
        </GridItem>
        <GridItem colSpan={1} display="flex">
          <Text marginStart="auto">
            {itemIndex + 1}/{items.length}
          </Text>
        </GridItem>
        <GridItem colSpan={1}>
          <SearchList setShownItems={setShownItems} />
        </GridItem>
        <GridItem colSpan={3} h="100%"></GridItem>
      </Grid>
      <Toaster />
    </PlayContext.Provider>
  );
};

export default PlayPage;
