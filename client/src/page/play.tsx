/* eslint-disable @typescript-eslint/no-unused-vars */
import { Spinner, Text } from "@chakra-ui/react";
import RecordsContext from "@/AppContext";
import { EmptyState } from "@/components/ui/empty-state";
import { randomString } from "@/lib/random";
import { fetchItems, fetchRecords, PlaylistItem } from "@/lib/youtube";
import { Heading, VStack, Box, Center } from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";
import ReactPlayer from "react-player";

function storedOrderCode() {
  const stored = localStorage.getItem("ranyouOrderCode");
  if (stored) return stored;
  const orderCode = randomString();
  localStorage.setItem("ranyouOrderCode", orderCode);
  return orderCode;
}

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

const ItemRow = ({ i, item }: { i: number; item: PlaylistItem }) => (
  <>
    <li key={i}>{item.title}</li>
    <hr style={{ margin: "5px" }} />
  </>
);

const PlayPage = ({ playlistId }: { playlistId: string }) => {
  const [itemIndex, setItemIndex] = useState(0);
  const [orderCode, setOrderCode] = useState(storedOrderCode());
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const { records, addRecord } = useContext(RecordsContext);

  // TODO: add alert on error
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
      .then((items) => setItems(items))
      .catch(console.log)
      .finally(() => setLoading(false));
  }, [playlistId, records, addRecord]);

  return (
    <>
      <Center>
        <VStack w="1/3">
          <Heading textAlign="center" textStyle="4xl" my="4vh">
            {records[playlistId]?.title ?? "unknown"} -{" "}
            {records[playlistId]?.channel_title ?? "unknown"}
          </Heading>
          <Box w="100%" aspectRatio={16 / 9}>
            {loading ? (
              <Center h="full">
                <VStack>
                  <Spinner size="xl" />
                  <Text>Loading...</Text>
                </VStack>
              </Center>
            ) : items.length > itemIndex + 2 ? (
              <ReactPlayer
                // playing={true}
                controls={true}
                url={`https://www.youtube.com/watch?v=${items[itemIndex].video_id}`}
                width="100%"
                height="100%"
              />
            ) : null}
          </Box>
          <Heading textStyle="2xl">Videos</Heading>
          {items.length === 0 ? (
            <EmptyState
              title="This playlist doesn't have any videos"
              description="Choose another playlist to start!"
            />
          ) : (
            <ol>
              {items.map((item, i) => (
                <ItemRow key={i} i={i} item={item} />
              ))}
            </ol>
          )}
        </VStack>
      </Center>
    </>
  );
};

export default PlayPage;
