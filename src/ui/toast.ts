import { el } from "./dom.ts";

const VISIBLE_MS = 2000;

export interface Toast {
  readonly element: HTMLElement;
  show(message: string): void;
}

/** A short message, announced to screen readers, that goes away by itself. */
export function createToast(): Toast {
  const element = el("div", { class: "toast", role: "status" });
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    element,
    show(message) {
      element.textContent = message;
      element.classList.add("visible");
      clearTimeout(timer);
      timer = setTimeout(() => {
        element.classList.remove("visible");
        element.textContent = "";
      }, VISIBLE_MS);
    },
  };
}
