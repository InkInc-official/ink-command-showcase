import React from "react";
import { createRoot } from "react-dom/client";
import ManagerApp from "./ManagerApp.jsx";
import WidgetApp from "./WidgetApp.jsx";

const path = window.location.pathname;

let RootComponent;

if (path.startsWith("/widget/")) {
  RootComponent = WidgetApp;
} else {
  RootComponent = ManagerApp;
}

createRoot(document.getElementById("root")).render(<RootComponent />);