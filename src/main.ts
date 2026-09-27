import "./styles.css";
import { startAnalytics } from "./analytics.ts";
import { startApp } from "./ui/app.ts";
import { setUpPwa } from "./ui/pwa.ts";

startAnalytics();
const root = document.querySelector("#app");
if (root instanceof HTMLElement) startApp(root);
setUpPwa();
