import "./styles.css";
import { startApp } from "./ui/app.ts";

const root = document.querySelector("#app");
if (root instanceof HTMLElement) startApp(root);
