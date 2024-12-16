import { createContext } from "react";

export const ColumnContext = createContext<{
  save: () => void;
}>({
  save: () => {},
});
