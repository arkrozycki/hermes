import React from "react";
import DesktopApp from "./desktop/DesktopApp";
import MobileApp from "./mobile/MobileApp";
import { isElectron } from "../lib/utils";

import "./App.css";

function App() {
  if (isElectron()) {
    return <DesktopApp />;
  } else {
    return <MobileApp />;
  }
}

export default App;
