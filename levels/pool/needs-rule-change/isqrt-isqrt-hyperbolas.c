int f(int x, int y) {
  int n = (x + 1) * (y + 1);
  int r = isqrt(n);
  return r * r == n ? 0 : r - 1;
}
