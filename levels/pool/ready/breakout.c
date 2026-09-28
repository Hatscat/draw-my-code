int f(int x, int y) {
  // bricks hit: one hex digit a row
  int hit = 0x0137;
  if (y < 4) {
    int b = hit >> (15 - 4*y - x/2);
    return b & 1 ? 0 : y + 2;
  }
  if (y == 7)
    return x > 1 && x < 5;
  return x == 6 && y == 5;
}
