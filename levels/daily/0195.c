int f(int x, int y) {
  int g[64] = {0}, p = 28, d = 0;
  int step[] = {-8, 1, 8, -1};
  for (int t = 0; t < 18; t++) {
    d = (d + (g[p] ? 3 : 1)) % 4;
    g[p] = !g[p];
    p += step[d];
  }
  if (8*y + x == p) return 2;
  return g[8*y + x] ? 5 : 0;
}
