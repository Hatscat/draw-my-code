int f(int x, int y) {
  int t[x + 1];
  t[x] = y;
  return t[x] & 7;
}
