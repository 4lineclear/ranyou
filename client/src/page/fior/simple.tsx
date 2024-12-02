import { Box, Center, Button, Fieldset, Input, Stack } from "@chakra-ui/react";
import { Field } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";

// import RecordsContext from "@/AppContext";
// import { useContext } from "react";

const SimpleFior = () => {
  return (
    <Box h="full" w="full">
      <Center h="full">
        <Fieldset.Root
          size="lg"
          maxW="lg"
          border="1px solid"
          p="4"
          rounded="lg"
          bg="bg.subtle"
        >
          <Stack>
            <Fieldset.Legend>Simple Rules</Fieldset.Legend>
            <Fieldset.HelperText>
              Add a simple set of rules with the below form.
            </Fieldset.HelperText>
          </Stack>

          <Fieldset.Content>
            <Field label="Filter By">
              <Input name="fitler" type="text" />
            </Field>

            <Field label="Order By">
              <Input name="order" type="text" />
            </Field>
            <Field>
              <Checkbox>Order Before Filter</Checkbox>
            </Field>
          </Fieldset.Content>

          <Button type="submit" alignSelf="flex-start">
            Add
          </Button>
        </Fieldset.Root>
      </Center>
    </Box>
  );
};

export default SimpleFior;
