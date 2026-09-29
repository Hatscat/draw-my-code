int f(int x, int y) {
  struct { unsigned on:1; } p = {0};
  p.on += x < 6 && y < 6;
  p.on += x > 1 && y > 1;
  return p.on ? 4 : 6;
}
