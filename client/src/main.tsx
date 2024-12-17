// import { StrictMode } from "react";
// import { createRoot } from "react-dom/client";
//
// import App from "./app.tsx";
// import "./main.css";
//
// createRoot(document.getElementById("root")!).render(
//   <StrictMode>
//       <App />
//   </StrictMode>,
// );

import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// Set up a Router instance
const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultStaleTime: 5000,
});

// Register things for typesafety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root")!;

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<RouterProvider router={router} />);
}
