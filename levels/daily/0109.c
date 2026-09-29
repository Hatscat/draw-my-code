int f(int x, int y) {
  // tick 5: lane y moved v[y] cells
  // a tick (< 0: left) and wraps
  int lane[] = {0, 0xCC, 0xE0, 0x88,
    0, 0xF3, 0x66, 0};
  int v[] = {0,1,-2,4,0,3,-1,0};
  int p = (x - 5*v[y] + 40) % 8;
  int hit = lane[y] << p & 0x80;
  if (!v[y]) return 5; // grass
  if (y > 4) return hit ? 3 : 6;
  return hit ? 2 : 0;
}
