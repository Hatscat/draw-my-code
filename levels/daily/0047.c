int f(int x, int y) {
  int n = 1;
  int ok = x > 1 && ++n && y > 1
    && ++n && x < 6 && ++n && y < 6;
  return n + ok;
}
