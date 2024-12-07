import { createContext, useContext, useEffect, useRef, useState } from "react";
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

import RecordsContext from "@/AppContext";
import { fetchItems, fetchRecords, PlaylistItem } from "@/lib/youtube";

import iso8601, { Duration } from "iso8601-duration";
import { Link, useLocation } from "wouter";
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

export interface IPlayContext {
  playlistId: string;
  items: PlaylistItem[];
  itemIndex: number;
  setItemIndex: (n: number) => void;
}

const PlayContext = createContext<IPlayContext>({
  playlistId: "",
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
  const [, navigate] = useLocation();
  const { playlistId, itemIndex, items } = useContext(PlayContext);
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
    <>
      <Flex
        cursor="pointer"
        key={index}
        p="3"
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
          navigate(`/play/${playlistId}/${item.index + 1}`);
          const behavior =
            Math.abs(index - itemIndex) < items.length / 100
              ? "smooth"
              : "auto";
          virtuoso.current?.scrollToIndex({ index: index, behavior });
        }}
      >
        <span>{item.title}</span>
        <span>{durationStr}</span>
      </Flex>
    </>
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
  const [, navigate] = useLocation();
  const { playlistId, items, itemIndex } = useContext(PlayContext);
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
      onEnded={() => navigate(`/play/${playlistId}/${itemIndex + 2}`)}
      onError={() => {
        toaster.create({
          title: "error playing video",
          type: "error",
          action: {
            label: "close",
            onClick: () => {},
          },
        });
        navigate(`/play/${playlistId}/${itemIndex + 1}`);
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
            <MenuItem cursor="pointer" value={pr.playlist_id} asChild>
              <Link href={"/play/" + pr.playlist_id}>{pr.title}</Link>
            </MenuItem>
          ))}
        </MenuContent>
      </MenuRoot>
      <BreadcrumbCurrentLink>{playlist.title}</BreadcrumbCurrentLink>
    </BreadcrumbRoot>
  );
};

// TODO: make init item index optional
const PlayPage = ({
  initItemIndex,
  playlistId,
}: {
  initItemIndex: number;
  playlistId: string;
}) => {
  const [itemIndex, setItemIndex] = useState(initItemIndex - 1);
  const [durationInfo, setDurationInfo] = useState({ max: 0, mean: 0 });
  const [loading, setLoading] = useState<"loading" | "loaded" | "failed">(
    "loading",
  );
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [shownItems, setShownItems] = useState<ShownItem[]>(
    items.map(toShownItem),
  );
  const { records, addRecord } = useContext(RecordsContext);

  const virtuoso = useRef<VirtuosoHandle>(null);

  const playProvider = {
    playlistId: playlistId,
    items: items,
    itemIndex: itemIndex,
    setItemIndex: setItemIndex,
  } satisfies IPlayContext;

  useEffect(() => {
    setItemIndex(initItemIndex - 1);
  }, [initItemIndex]);
  useEffect(() => {
    if (!records[playlistId]) {
      fetchRecords(playlistId)
        .then((record) => {
          if (record instanceof Response) return;
          addRecord(record);
        })
        .catch(console.log);
    }
    fetchItems(playlistId)
      .then((items) => {
        let max = 0;
        let total = 0;
        for (const item of items) {
          const n = iso8601.toSeconds(iso8601.parse(item.duration));
          max = n > max ? n : max;
          total += n;
        }
        const mean = total / items.length;
        setDurationInfo({ max, mean });
        setItems(items);
        setShownItems(items.map(toShownItem));
        setLoading("loaded");
      })
      .catch((e) => {
        console.log(e);
        setLoading("failed");
      });
  }, [playlistId, records, addRecord]);

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
        <GridItem colSpan={1} display="flex" alignItems="start">
          <Heading textStyle="xl">
            <Link href="/fior/">fior</Link>
          </Heading>
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
        <GridItem colSpan={3} h="100%" display="flex"></GridItem>
      </Grid>
      <Toaster />
    </PlayContext.Provider>
  );
};

export default PlayPage;
