export type ShareOutcome = "shared" | "copied" | "cancelled" | "failed";

/**
 * Shares the result: the system share sheet on touch devices that have one, the clipboard
 * otherwise. Call it straight from the click handler, before any await: both APIs need the
 * click's user activation.
 */
export async function shareResult(text: string): Promise<ShareOutcome> {
  if ("share" in navigator && matchMedia("(pointer: coarse)").matches) {
    try {
      await navigator.share({ text });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
      // Otherwise the share sheet failed: try the clipboard.
    }
  }
  if (clipboardAllowed()) {
    try {
      await navigator.clipboard.writeText(text);
      return "copied";
    } catch {
      // Denied after all: try the old way.
    }
  }
  return copyBySelection(text) ? "copied" : "failed";
}

/**
 * Whether this page may use the Clipboard API: not in a frame denied it, such as itch.io's game
 * frame, where Chromium logs an error for each call. Only Chromium can tell; elsewhere, try.
 */
function clipboardAllowed(): boolean {
  const policy = (document as { readonly featurePolicy?: { allowsFeature(name: string): boolean } })
    .featurePolicy;
  return policy?.allowsFeature("clipboard-write") ?? true;
}

/**
 * Copies from a selected, unseen field: deprecated, but allowed during the click's activation, even
 * in a frame denied the Clipboard API.
 */
function copyBySelection(text: string): boolean {
  const focused = document.activeElement;
  const field = document.createElement("textarea");
  field.value = text;
  field.readOnly = true;
  field.style.position = "fixed";
  field.style.opacity = "0";
  field.style.pointerEvents = "none";
  document.body.append(field);
  field.select();
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    // Some browsers throw instead of returning false.
  }
  field.remove();
  // Back to Share, for a keyboard player.
  if (focused instanceof HTMLElement) focused.focus();
  return copied;
}
