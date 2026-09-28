int f(int x, int y) {
  // 2 x 2 samples per cell
  int n = 0;
  for (int i = 1; i < 4; i += 2)
    for (int j = 1; j < 4; j += 2) {
      int u = 4*x + i - 16;
      int v = 4*y + j - 16;
      n += u*u + v*v < 210;
    }
  return n;
}
