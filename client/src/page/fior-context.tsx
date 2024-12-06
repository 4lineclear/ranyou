import { FiorData } from "@/lib/fior";
import React from "react";

export interface IFiorContext {
  items: FiorData;
  setItems: (items: FiorData) => void;
}

const FiorContext = React.createContext<IFiorContext>({
  items: { columns: [] },
  setItems() {},
});

export default FiorContext;
