int f(int x, int y) {
  int v = x == 3 ? -2147483647 - 1 : x;
  return abs(v) & 7;
}
