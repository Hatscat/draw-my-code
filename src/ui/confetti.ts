import { el } from "./dom.ts";
import { PALETTE } from "./palette.ts";

const PIECES = 150;
/** In ms, the last FADE of which fade out. */
const DURATION = 3000;
const FADE = 700;
/** Gravity in px/s², and air drag per second: together they cap the fall at 200 px/s. */
const GRAVITY = 600;
const DRAG = 3;

interface Piece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  readonly spin: number;
  /** The tumble's phase: it flattens the piece as it turns, and sways it sideways. */
  tumble: number;
  readonly tumbleSpeed: number;
  readonly size: number;
  readonly color: string;
}

const between = (min: number, max: number) => min + Math.random() * (max - min);

/**
 * Confetti in the palette's colors bursting out of `area` (the grid) and drifting down over the
 * page for a couple of seconds. Purely decorative: it never takes input, and players who prefer
 * reduced motion don't get it.
 */
export function celebrate(area: DOMRect): void {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const canvas = el("canvas", { class: "confetti", "aria-hidden": "true" });
  const context = canvas.getContext("2d");
  if (!context) return;
  const width = innerWidth;
  const height = innerHeight;
  const ratio = devicePixelRatio || 1;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  context.scale(ratio, ratio);
  document.body.append(canvas);

  // Black would vanish against the page.
  const colors = PALETTE.slice(1).map((color) => color.hex);
  const pieces = Array.from({ length: PIECES }, (): Piece => {
    // Mostly upward, fanning out up to about 60° either side.
    const direction = -Math.PI / 2 + between(-1.1, 1.1);
    const speed = between(700, 1600);
    return {
      x: between(area.left, area.right),
      y: between(area.top, area.bottom),
      vx: Math.cos(direction) * speed,
      vy: Math.sin(direction) * speed,
      angle: between(0, 2 * Math.PI),
      spin: between(-6, 6),
      tumble: between(0, 2 * Math.PI),
      tumbleSpeed: between(4, 12),
      size: between(6, 11),
      color: colors[Math.floor(Math.random() * colors.length)] ?? "#ffffff",
    };
  });

  let start: number | undefined;
  let previous: number | undefined;
  // An arrow function, not a declaration: TypeScript then knows `context` isn't null in it.
  const frame = (now: number) => {
    start ??= now;
    // Capped: after a stall (a busy or hidden tab) pieces carry on instead of teleporting.
    const dt = Math.min(now - (previous ?? now), 50) / 1000;
    previous = now;
    const elapsed = now - start;
    const slowdown = Math.exp(-DRAG * dt);
    context.clearRect(0, 0, width, height);
    context.globalAlpha = Math.min(1, (DURATION - elapsed) / FADE);
    for (const piece of pieces) {
      piece.vx = piece.vx * slowdown + Math.sin(piece.tumble) * 120 * dt;
      piece.vy = piece.vy * slowdown + GRAVITY * dt;
      piece.x += piece.vx * dt;
      piece.y += piece.vy * dt;
      piece.angle += piece.spin * dt;
      piece.tumble += piece.tumbleSpeed * dt;
      context.save();
      context.translate(piece.x, piece.y);
      context.rotate(piece.angle);
      context.scale(1, Math.cos(piece.tumble));
      context.fillStyle = piece.color;
      context.fillRect(-piece.size / 2, -piece.size / 3, piece.size, (piece.size * 2) / 3);
      context.restore();
    }
    if (elapsed < DURATION) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}
