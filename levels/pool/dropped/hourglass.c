int f(int x, int y) {
  int u = abs(2*x - 7);
  int v = abs(2*y - 7);
  if (u > v) return 0;
  if (v == 7) return 3;
  if (y < 4) return y > 1 ? 4 : 1;
  if (u == 1) return 4;
  return y > 5 ? 4 : 1;
}
