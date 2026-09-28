int f(int x, int y) {
  int u = 2*x - 7, v = 2*y - 7;
  int r = u*u + v*v;
  if (u*u + 3*v*v > 80) return 0;
  if (r > 18) return 1;
  return r > 2 ? 6 : 0;
}
