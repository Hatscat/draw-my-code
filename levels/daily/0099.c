int f(int x, int y) {
  // threads: 4 dark, then 4 light
  int warp = x / 4, weft = y / 4;
  // 2/2 twill: which one is on top?
  int up = (x + y) % 4 < 2;
  return (up ? warp : weft) ? 1 : 0;
}
