int f(int x, int y) {
  int u = 2*x - 7, a = abs(u);
  int h = 4*y + 2;
  if (h < a || h > 32 - a) return 0;
  if (h < 16 - a) return 4;
  return u < 0 ? 3 : 2;
}
