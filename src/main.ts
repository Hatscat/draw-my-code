import "./styles.css";
import { startAnalytics } from "./analytics.ts";
import { startApp } from "./ui/app.ts";
import { watchInstall } from "./ui/install.ts";
import { setUpPwa } from "./ui/pwa.ts";

// iOS Safari shows a button's :active (pressed) style on touch only when a touchstart listener
// exists. This one handles nothing: all input goes through Pointer Events.
document.body.addEventListener("touchstart", () => {}, { passive: true });
watchInstall();
startAnalytics();
const root = document.querySelector("#app");
if (root instanceof HTMLElement) startApp(root);
setUpPwa();
