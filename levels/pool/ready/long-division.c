int f(int x, int y) {
  // 1 / (y + 2), digit by digit
  int d = y + 2, r = 1, q = 0;
  for (int i = 0; i <= x; i++) {
    q = r * 8 / d;
    r = r * 8 % d;
  }
  return q;
}
