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
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}
