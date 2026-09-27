import { el } from "./dom.ts";

/** The info panel's Replay tutorial button, on the screens other than the tutorial. */
export function replayButton(onReplay: () => void): HTMLElement {
  const button = el(
    "button",
    { type: "button", class: "text-button" },
    "Replay tutorial",
  );
  button.addEventListener("click", onReplay);
  return button;
}
