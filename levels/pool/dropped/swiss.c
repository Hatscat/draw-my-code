int f(int x, int y) {
  int u = abs(2*x - 7);
  int v = abs(2*y - 7);
  int arm = min(u, v) < 3;
  int len = max(u, v) < 6;
  return arm && len ? 1 : 2;
}
