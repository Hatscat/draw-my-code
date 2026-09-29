int f(int x, int y) {
  // a cake with a hole, cut once on
  // the line through both centers:
  // (4, 4) and (6, 3) from a corner
  if (x > 4 && x < 7 && y / 2 == 1)
    return 0;
  // cell (x, y) is centered on
  // (x + 1/2, y + 1/2)
  return x + 2*y <= 10 ? 3 : 4;
}
