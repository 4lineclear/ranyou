import { useContext, useEffect, useRef, useState } from "react";
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
  createListCollection,
} from "@chakra-ui/react";
import { EmptyState } from "@/components/ui/empty-state";
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "@/components/ui/select";
import { ColorModeButton } from "@/components/ui/color-mode";

import ReactPlayer from "react-player";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";

import RecordsContext from "@/AppContext";
import { randomString } from "@/lib/random";
import { fetchItems, fetchRecords, PlaylistItem } from "@/lib/youtube";

import iso8601, { Duration } from "iso8601-duration";
import { Link, useLocation } from "wouter";
import { Switch } from "@/components/ui/switch";
import PlayContext, { IPlayContext } from "./play-context";
import { Toaster, toaster } from "@/components/ui/toaster";
import { Slider } from "@/components/ui/slider";

function storedOrderCode() {
  const stored = localStorage.getItem("ranyouOrderCode");
  if (stored) return stored;
  const orderCode = randomString();
  localStorage.setItem("ranyouOrderCode", orderCode);
  return orderCode;
}

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
  item: PlaylistItem;
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
  if (item.video_id === items[itemIndex].video_id) {
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
          navigate(`/${playlistId}/${index + 1}`);
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
  setShownItems: (i: PlaylistItem[]) => void;
}) => {
  const { items } = useContext(PlayContext);
  const [search, setSearch] = useState("");
  const [searchTitle, setSearchTitle] = useState(true);
  const [searchDesc, setSearchDesc] = useState(false);

  const searchItems = (needle: string, st: boolean, sd: boolean) =>
    items.filter((v) => {
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

const Player = ({ loading }: { loading: Loading }) => {
  const [playing, setPlaying] = useState(false);
  const [, navigate] = useLocation();
  const { playlistId, items, itemIndex } = useContext(PlayContext);
  switch (loading) {
    case "loading":
      return (
        <Center h="full">
          <VStack>
            <Spinner size="xl" />
            <Text>Loading...</Text>
          </VStack>
        </Center>
      );
    case "loaded":
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
          onEnded={() => navigate(`/${playlistId}/${itemIndex + 1}`)}
          onError={() => {
            toaster.create({
              title: "error playing video",
              type: "error",
              action: {
                label: "close",
                onClick: () => { },
              },
            });
            navigate(`/${playlistId}/${itemIndex + 1}`);
          }}
        />
      );
    case "failed":
      break;
  }
};

const PlaylistSelector = () => {
  const [, navigate] = useLocation();
  const { records } = useContext(RecordsContext);
  const { playlistId } = useContext(PlayContext);

  const recordCollection = createListCollection({
    items: Object.values(records).map((pr) => ({
      label: pr.title,
      value: pr.playlist_id,
    })),
  });
  const [selectedPlaylist, setSelectedPlaylist] = useState([playlistId]);

  return (
    <SelectRoot
      size="sm"
      width="50%"
      collection={recordCollection}
      value={selectedPlaylist}
      onValueChange={(vcd) => {
        setSelectedPlaylist(vcd.value);
        console.log(vcd.value);
        if (vcd.items[0]) navigate("/" + vcd.items[0].value);
      }}
      multiple={false}
    >
      <SelectTrigger>
        <SelectValueText placeholder="Playlist" />
      </SelectTrigger>
      <SelectContent>
        {recordCollection.items.map((pr) => (
          <SelectItem item={pr} key={pr.value}>
            {pr.label}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectRoot>
  );
};

type Loading = "loading" | "loaded" | "failed";

const PlaySlider = () => {
  const { items, itemIndex } = useContext(PlayContext);
  const [value, setValue] = useState([0]);

  const item = items[itemIndex];
  if (!item) return null;
  const duration = iso8601.parse(item.duration);
  const seconds = iso8601.toSeconds(duration) * (value[0] / 100);
  const secStr = new Date(seconds * 1000).toISOString();
  return (
    <>
      <Slider
        mx="2"
        size="lg"
        value={value}
        onValueChange={(e) => setValue(e.value)}
        thumbAlignment="contain"
        defaultValue={[0]}
      />
      <Flex justifyContent="space-between">
        <span>00:00</span>
        <span>{seconds > 3600 ? secStr.substring(11, 19) : secStr.substring(14, 19)}</span>
        <span>{displayDuration(duration)}</span>
      </Flex>
    </>
  );
};

const PlayPage = ({
  initItemIndex,
  playlistId,
}: {
  initItemIndex: number;
  playlistId: string;
}) => {
  const [itemIndex, setItemIndex] = useState(initItemIndex - 1);
  const [durationInfo, setDurationInfo] = useState({ max: 0, mean: 0 });
  const [loading, setLoading] = useState<Loading>("loading");
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [shownItems, setShownItems] = useState(items.slice());
  const { records, addRecord } = useContext(RecordsContext);

  const virtuoso = useRef<VirtuosoHandle>(null);

  const playProvider = {
    playlistId: playlistId,
    items: items,
    itemIndex: itemIndex,
    setItemIndex: setItemIndex,
  } satisfies IPlayContext;

  // TODO: add alert on error
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
          if (item.title.trim() == "") {
            console.log(item.title + " " + item.video_id);
          }
        }
        const mean = total / items.length;
        setDurationInfo({ max, mean });
        setItems(items);
        setShownItems(items);
        setLoading("loaded");
      })
      .catch((e) => {
        console.log(e);
        setLoading("failed");
      });
  }, [playlistId, records, addRecord]);

  // TODO: change the below to grid system

  return (
    <PlayContext.Provider value={playProvider}>
      <Flex h="100vh" direction="column">
        <Group>
          <Box p="2" w="60%">
            <Flex alignItems="baseline">
              <Heading textStyle="4xl">
                {records[playlistId]?.title ?? "unknown"}
              </Heading>
              <Text marginStart="10px" textStyle="xl">
                {records[playlistId]?.description}
              </Text>
              <Text marginStart="auto" textStyle="lg">
                {records[playlistId]?.channel_title}
              </Text>
            </Flex>
          </Box>
          <Box w="40%">
            <Flex>
              <PlaylistSelector />
              <ColorModeButton marginStart="auto" />
            </Flex>
          </Box>
        </Group>
        <Group>
          <Box w="60%" position="relative" aspectRatio={16 / 9}>
            <Player loading={loading} />
          </Box>
          <Box w="40%" h="100%">
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
          </Box>
        </Group>
        <Group mt="1">
          <Box w="60%">
            <Flex>
              <Box>
                <Text textStyle="xl">
                  {items[itemIndex]?.title ?? "unknown"}
                </Text>
                <Text textStyle="md">
                  {items[itemIndex]?.channel_title ?? "unknown"}
                </Text>
              </Box>
              <Text marginStart="auto">
                {itemIndex + 1}/{items.length}
              </Text>
            </Flex>
          </Box>
          <Box w="40%">
            <SearchList setShownItems={setShownItems} />
          </Box>
        </Group>
        <Group w="full" h="full">
          <Box w="60%" h="full">
            <PlaySlider></PlaySlider>
          </Box>
          <Flex w="40%" h="full">
            <Heading textStyle="3xl" m="auto 10px 10px auto">
              <Link href="/">ranyou</Link>
            </Heading>
          </Flex>
        </Group>
      </Flex>
      <Toaster />
    </PlayContext.Provider>
  );
};

export default PlayPage;
