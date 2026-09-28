int f(int x, int y) {
  int u = abs(2*x - 7);
  if (y < 2) return 6;
  if (u > 2*y - 3) return 5;
  if (u == 1) return y % 2 * 4;
  return 0;
}
