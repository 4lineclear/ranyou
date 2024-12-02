import { ColorModeButton } from "@/components/ui/color-mode";
import {
  AbsoluteCenter,
  Grid,
  GridItem,
  Heading,
  Spinner,
  Tabs,
} from "@chakra-ui/react";

import { Link, Route } from "wouter";
import SimpleFior from "./simple";
import { lazy, Suspense } from "react";

// import RecordsContext from "@/AppContext";
// import { useContext } from "react";
// const { records } = useContext(RecordsContext);

// TODO: use react-grid-layout

// TODO: create sql like language for this data

const Fior = ({ path }: { path: string }) => {
  const Raw = lazy(() => import("./raw"));
  return (
    <Grid
      w="100%"
      h="100vh"
      gap="0"
      autoRows="auto 1fr"
      templateColumns="repeat(2, 1fr)"
    >
      <GridItem display="flex" alignItems="baseline" gap="3">
        <Heading textStyle="3xl" ms="3">
          <Link href="/">ranyou</Link>
        </Heading>
        <Heading textStyle="2xl">fi(lter) or(der)</Heading>
        <Tabs.Root variant="subtle" defaultValue={path}>
          <Tabs.List>
            <Tabs.Trigger value="menu" asChild>
              <Link href="/fior/">Menu</Link>
            </Tabs.Trigger>
            <Tabs.Trigger value="simple" asChild>
              <Link href="/fior/simple">Simple</Link>
            </Tabs.Trigger>
            <Tabs.Trigger value="complex" asChild>
              <Link href="/fior/complex">Complex</Link>
            </Tabs.Trigger>
            <Tabs.Trigger value="raw" asChild>
              <Link href="/fior/raw">Raw</Link>
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      </GridItem>
      <GridItem display="flex" alignItems="start">
        <ColorModeButton marginStart="auto" />
      </GridItem>
      <GridItem colSpan={2}>
        <Route path="/fior/simple" component={SimpleFior} />
        <Route path="/fior/raw">
          <Suspense
            fallback={
              <AbsoluteCenter>
                <Spinner size="xl" />
              </AbsoluteCenter>
            }
          >
            <Raw />
          </Suspense>
        </Route>
      </GridItem>
    </Grid>
  );
};

export default Fior;
