int f(int x, int y) {
  // the arrow moves one cell right:
  // paint the green, erase the red
  unsigned was[] = {0, 0x08, 0x18,
    0x3F, 0x3F, 0x18, 0x08, 0};
  unsigned now = was[y] << 1;
  unsigned add = now & ~was[y];
  unsigned del = was[y] & ~now;
  if (add >> x & 1) return 5;
  if (del >> x & 1) return 2;
  return was[y] >> x & 1;
}
