import { el } from "./dom.ts";
import { installWay, onInstallChange, promptInstall } from "./install.ts";

/**
 * Invites the player to install the app, in a modal dialog: the browser's own prompt where there
 * is one, otherwise where to find it in the browser's menu. Does nothing if this browser can't
 * install the app, or already has. `opener`: the button that opened it, if any.
 */
export function offerInstall(opener?: HTMLElement): void {
  const way = installWay();
  if (!way) return;
  const title = el("h2", { id: "install-title", class: "heading" }, "Install Draw my code");
  const done = el("button", { type: "button", class: "text-button" }, "Got it");
  const how = way === "prompt"
    ? [el("p", {}, "Play from your home screen or desktop, like an app. It works offline too.")]
    : way === "ios"
    ? [
      el("p", {}, "Play from your home screen, like an app. It works offline too."),
      el(
        "ol",
        {},
        el("li", {}, "Tap the Share button."),
        el("li", {}, "Choose Add to Home Screen."),
      ),
      // iOS gives home screen apps their own storage: the tutorial comes back there.
      el("p", {}, "The app keeps its own progress: skip the tutorial there."),
    ]
    : [el("p", {}, "Play from your Dock, like an app. In Safari's File menu, choose Add to Dock.")];
  const actions = el("div", { class: "dialog-actions" });
  if (way === "prompt") {
    done.textContent = "Not now";
    const install = el(
      "button",
      { type: "button", class: "button button-small", autofocus: true },
      "Install",
    );
    install.addEventListener("click", () => {
      // Called in the click handler: browsers only open the prompt from a user gesture.
      promptInstall();
      dialog.close();
    });
    actions.append(done, install);
  } else {
    done.autofocus = true;
    actions.append(done);
  }
  done.addEventListener("click", () => dialog.close());
  const dialog = el(
    "dialog",
    { class: "dialog", "aria-labelledby": "install-title" },
    title,
    ...how,
    actions,
  );
  dialog.addEventListener("close", () => {
    dialog.remove();
    // Closing a modal dialog puts the focus back on its opener, unless the prompt just spent
    // hid it: then on the first control beside it.
    const beside = opener?.parentElement?.querySelector<HTMLElement>(":scope > :not([hidden])");
    if (opener?.hidden) beside?.focus();
  });
  document.body.append(dialog);
  dialog.showModal();
}

/** The info panel's Install app button: shown only while this browser can install the app. */
export function installButton(): HTMLElement {
  const button = el("button", { type: "button", class: "text-button" }, "Install app");
  button.addEventListener("click", () => offerInstall(button));
  const update = () => (button.hidden = installWay() === undefined);
  const unsubscribe = onInstallChange(() => {
    // The screen that held the button is gone: stop listening.
    if (button.isConnected) update();
    else unsubscribe();
  });
  update();
  return button;
}
