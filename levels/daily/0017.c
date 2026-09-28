int f(int x, int y) {
  // a = 3, b = 4, c = 5
  int u = 3*x - 4*y;
  int v = 4*x + 3*y;
  if (u > 9) return 2;
  if (u < -16) return 3;
  if (v < 12) return 4;
  if (v > 37) return 5;
  return 6;
}
