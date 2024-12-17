import {
  Heading,
  Text,
  AbsoluteCenter,
  VStack,
  LinkOverlay,
} from "@chakra-ui/react";
import { Link } from "@tanstack/react-router";

export default function NotFound() {
  return (
    <LinkOverlay asChild>
      <Link href="/">
        <AbsoluteCenter>
          <VStack>
            <Heading size="6xl">404</Heading>
            <Text fontSize="3xl" color="lightslategray">
              Page Not Found
            </Text>
            <Text>Click anywhere to go home</Text>
          </VStack>
        </AbsoluteCenter>
      </Link>
    </LinkOverlay>
  );
}
