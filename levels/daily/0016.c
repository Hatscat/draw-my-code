int f(int x, int y) {
  int n = 8*y + x, r = 0;
  while ((r + 1) * (r + 1) <= n)
    r++;
  return r;
}
