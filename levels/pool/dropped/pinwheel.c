int f(int x, int y) {
  if (x > 3 || y > 3) {
    // a quarter turn, one color on
    int c = f(y, 7 - x);
    return c ? c + 1 : 0;
  }
  return x >= y ? 2 : 0;
}
