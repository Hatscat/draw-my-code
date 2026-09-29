int f(int x, int y) {
  // add x + y in binary
  int c = 0, n = 0;
  for (int i = 0; i < 3; i++) {
    c = (x % 2 + y % 2 + c) / 2;
    n += c;
    x /= 2, y /= 2;
  }
  return n;
}
