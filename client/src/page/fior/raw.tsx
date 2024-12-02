import { useCallback, useEffect, useState } from "react";

import pql from "@/lib/pql";
import CodeMirror, { Compartment, EditorView } from "@uiw/react-codemirror";
import { vim } from "@replit/codemirror-vim";

import { Box, Flex } from "@chakra-ui/react";
import { useColorModeValue } from "@/components/ui/color-mode";
import { Switch } from "@/components/ui/switch";
import pqlLinter from "@/lib/lint";
import pqlCompletion from "@/lib/autocomplete";

const testVal = `\
let vids = fn(list: PlayList, max: Number)
  let nested = fn()
    return select *
      from list
      where duration < max;
  end;
  return nested();
end;

return vids(music, 180000);`;


const vimComp = new Compartment();
const ext = [vimComp.of(vim()), pql(), pqlLinter, pqlCompletion];

// function getLocal<T>(key: string): T | null {
//   const item = localStorage.getItem(key);
//   if (!item) return null;
//   return JSON.parse(item);
// }

const Raw = () => {
  const color = useColorModeValue("light", "dark");
  const [value, setValue] = useState(testVal);
  const setVal = useCallback((val: string) => {
    // PQLLanguage.parser.parse(val).iterate({
    //   enter: (node) => {
    //     console.log(node.name);
    //     return true;
    //   },
    // });
    setValue(val);
  }, []);
  const [vimEnabled, setVimEnabled] = useState(
    JSON.parse(localStorage.getItem("vimEnabled") ?? "false"),
  );
  const vimChange = (v: boolean) => {
    localStorage.setItem("vimEnabled", v.toString());
    setVimEnabled(v);
  };
  const [view, setView] = useState<EditorView>();

  useEffect(() => {
    vimChange(vimEnabled);
    view?.dispatch({
      effects: vimComp.reconfigure(vimEnabled ? vim() : []),
    });
  }, [view, vimEnabled]);

  return (
    <Flex p="3" h="full" w="full" direction="column">
      <Box p="3" border="solid 2px" rounded="md">
        <CodeMirror
          theme={color}
          value={value}
          placeholder="rules"
          onChange={setVal}
          height="full"
          width="100%"
          className="CodeMirror"
          extensions={ext}
          basicSetup={{ drawSelection: true, syntaxHighlighting: true }}
          onCreateEditor={(v) => setView(v)}
          autoFocus
        />
      </Box>
      <Flex
        alignSelf="center"
        mt="auto"
        w={{
          base: "2/3",
          lg: "2/5",
        }}
        p="2"
        border="solid 2px"
        rounded="md"
        gap="3"
      >
        Editor Settings
        <span style={{ border: "solid 1px" }} />
        <Switch
          checked={vimEnabled}
          onCheckedChange={(d) => vimChange(d.checked)}
        >
          Vim
        </Switch>
      </Flex>
    </Flex>
  );
};

export default Raw;
