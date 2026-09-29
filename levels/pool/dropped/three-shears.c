int f(int x, int y) {
  int u = 2*x - 7, v = 2*y - 7;
  // three shears
  u -= v;
  v += u;
  u -= v;
  // a Tetris L, in blocks of 2 x 2
  int i = (u + 7) / 4;
  int j = (v + 7) / 4;
  if (i == 1 && j < 3) return 3;
  return i == 2 && j == 2 ? 3 : 0;
}
