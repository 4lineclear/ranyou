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
  Image,
} from "@chakra-ui/react";
import { useContext, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckboxCard } from "@/components/ui/checkbox-card";
import { Field } from "@/components/ui/field";

import RecordsContext from "@/AppContext";
import { fetchRecords, PlaylistRecord } from "@/lib/youtube";

const numLen = (num: number) => Math.ceil(Math.log10(num + 1));

const RecordComponent = ({ pr }: { pr: PlaylistRecord }) => {
  return (
    <Center
      position="relative"
      width="100%"
      md={{ width: "3/4" }}
      lg={{ width: "1/2" }}
    >
      <CheckboxCard
        image={
          <Image
            src={pr.thumbnail}
            my="-16px"
            ml="-16px"
            height="inherit"
            width="auto"
          />
        }
        label={pr.title}
        description={pr.channel_title}
        width="100%"
        addon={
          <HStack>
            <Badge variant="solid">{pr.privacy_status}</Badge>
            <Text>{pr.published_at.toDateString()}</Text>
          </HStack>
        }
        md={{ width: "75%" }}
        lg={{ width: "50%" }}
      />
      <Float placement="top-start" offsetX={numLen(pr.playlist_length)}>
        <Mark variant="solid" rounded="md">
          {pr.playlist_length}
        </Mark>
      </Float>
    </Center>
  );
};

const MenuPage = () => {
  const [playlistId, setPlaylistId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { records, addRecord } = useContext(RecordsContext);

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
          if (status === 400) setMessage(record.statusText);
          if (status === 500) setMessage(record.statusText);
          return;
        }
        setMessage("");
        addRecord(record);
      })
      .catch((e) => {
        console.log(e);
      })
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
      <VStack width="96vw" mx="2vw">
        {Object.values(records).map((pr, i) => (
          <RecordComponent key={i} pr={pr} />
        ))}
      </VStack>
    </>
  );
};

export default MenuPage;
