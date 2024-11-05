import { Route, Switch } from "wouter";
import "./main.scss";
import MenuPage from "./page/menu";
import PlayPage from "./page/play";

export default function App() {
  return (
    <>
      <Switch>
        <Route path="/">
          <MenuPage></MenuPage>
        </Route>
        <Route path="/:playlist-id">
          {(params) => <PlayPage playlistId={params["playlist-id"]}></PlayPage>}
        </Route>
      </Switch>
    </>
  );
}
