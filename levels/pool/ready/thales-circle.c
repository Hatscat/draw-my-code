int f(int x, int y) {
  // A = (1, 1), B = (6, 6)
  int d = (x - 1) * (x - 6)
    + (y - 1) * (y - 6);
  if (d > 0) return 0;
  if (d == 0 || x == y) return 2;
  return 1;
}
