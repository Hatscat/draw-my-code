int f(int x, int y) {
  int dx = 2*x - 7, dy = 2*y - 7;
  if (dx*dx + dy*dy > 63)
    return 0;
  // row y is byte y, 1s are white
  unsigned long t = 0x1F373E1C;
  if (y > 3)
    t = ~t, x = 7 - x, y = 7 - y;
  return t >> (8*y + x) & 1 ? 1 : 6;
}
