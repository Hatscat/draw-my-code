import "./styles.css";
import { startApp } from "./ui/app.ts";
import { setUpPwa } from "./ui/pwa.ts";

const root = document.querySelector("#app");
if (root instanceof HTMLElement) startApp(root);
setUpPwa();
