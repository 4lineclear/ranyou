import {
  Badge,
  Center,
  Float,
  Heading,
  HStack,
  Input,
  Stack,
  Text,
  VStack,
  Mark,
} from "@chakra-ui/react";
import { useContext, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckboxCard } from "@/components/ui/checkbox-card";
import { Field } from "@/components/ui/field";

import RecordsContext from "@/app-context";
import { fetchRecords, PlaylistRecord } from "@/lib/youtube";
import { EmptyState } from "@/components/ui/empty-state";
import { LuPlay, LuTrash2 } from "react-icons/lu";
import {
  ActionBarContent,
  ActionBarRoot,
  ActionBarSelectionTrigger,
  ActionBarSeparator,
} from "@/components/ui/action-bar";
import { useLocation } from "wouter";

const numLen = (num: number) => Math.ceil(Math.log10(num + 1));

const RecordComponent = ({
  pr,
  checked,
  checkPlaylist,
}: {
  pr: PlaylistRecord;
  checked: boolean;
  checkPlaylist: (checked: boolean) => void;
}) => {
  const [, navigate] = useLocation();
  return (
    <Center
      position="relative"
      width="100%"
      md={{ width: "3/4" }}
      lg={{ width: "1/2" }}
    >
      <CheckboxCard
        label={pr.title}
        description={pr.channel_title}
        width="100%"
        addon={
          <HStack>
            <Badge variant="solid">{pr.privacy_status}</Badge>
            <Text>{pr.published_at.toDateString()}</Text>
            <Button
              ms="auto"
              h="inherit"
              onClick={() => navigate("/play/" + pr.playlist_id)}
            >
              Play
            </Button>
          </HStack>
        }
        md={{ width: "75%" }}
        lg={{ width: "50%" }}
        checked={checked}
        onCheckedChange={(d) => {
          if (d.checked !== "indeterminate") checkPlaylist(d.checked);
        }}
      />
      <Float placement="top-start" offsetX={numLen(pr.playlist_length)}>
        <Mark variant="solid" rounded="md" px="1">
          {pr.playlist_length}
        </Mark>
      </Float>
    </Center>
  );
};

const MenuPage = () => {
  const [, navigate] = useLocation();
  // const [selectedPlaylists, setSelectedPlaylists] = useState<string[]>([]);
  const [playlistId, setPlaylistId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { records, addRecord, removeRecord } = useContext(RecordsContext);
  const [checkedRecords, setCheckedRecords] = useState<boolean[]>(
    new Array(Object.entries(records).length).fill(false),
  );

  const handleSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    if (records[playlistId]) {
      setMessage("Playlist Already Added");
      return;
    }
    setLoading(true);
    fetchRecords(playlistId)
      .then((record) => {
        if (record instanceof Response) {
          const status = record.status;
          if (status === 400 || status === 500) setMessage(record.statusText);
          return;
        }
        setMessage("");
        addRecord(record);
        setCheckedRecords([...checkedRecords, false]);
      })
      .catch(setMessage)
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <>
      <VStack>
        <Heading textStyle="6xl" textAlign="center" my="8vh">
          Ran(dom) You(Tube)
        </Heading>
        <Stack direction="row" w="98vw" sm={{ w: "3/4" }} md={{ w: "1/2" }}>
          <Field required invalid={message !== ""} errorText={message}>
            <Input
              size="lg"
              placeholder="playlist-id"
              value={playlistId}
              onChange={(e) => setPlaylistId(e.target.value)}
              required
            />
          </Field>
          <Button size="lg" onClick={handleSubmit} loading={loading}>
            Add
          </Button>
        </Stack>
        <Heading textStyle="xl" mt="8vh" mb="4vh">
          Playlists
        </Heading>
      </VStack>
      {Object.values(records).length ? (
        <VStack width="96vw" mx="2vw">
          {Object.values(records).map((pr, i) => (
            <RecordComponent
              key={i}
              pr={pr}
              checked={checkedRecords[i]}
              checkPlaylist={(checked) => {
                checkedRecords[i] = checked;
                setCheckedRecords(checkedRecords.map((c) => c));
              }}
            />
          ))}
        </VStack>
      ) : (
        <EmptyState
          title="You haven't added any playlists yet"
          description="Start by adding playlists above!"
        />
      )}
      <ActionBarRoot
        open={checkedRecords.some((c) => c)}
        closeOnInteractOutside={false}
      >
        <ActionBarContent>
          <ActionBarSelectionTrigger>
            {checkedRecords.filter((c) => c).length} selected
          </ActionBarSelectionTrigger>
          <ActionBarSeparator />
          <Button
            variant="outline"
            size="sm"
            colorPalette="red"
            onClick={() => {
              const count = Object.keys(records).length - checkedRecords.length;
              checkedRecords
                .map((_, n) => Object.keys(records)[n])
                .forEach(removeRecord);
              setCheckedRecords(new Array(count).fill(false));
            }}
          >
            <LuTrash2 />
            Delete
          </Button>
          <Button
            variant="outline"
            size="sm"
            colorPalette="green"
            onClick={() => navigate("/play/" + checkedRecords[0])}
          >
            <LuPlay />
            Play
          </Button>
        </ActionBarContent>
      </ActionBarRoot>
    </>
  );
};

export default MenuPage;
