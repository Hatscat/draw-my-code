int f(int x, int y) {
  int h = 7 - y;
  // rays of slope 2, 1 and 1/2
  if (h > 2 * x) return 6;
  if (h > x) return 4;
  if (h > x * (1 / 2)) return 2;
  return 0;
}
