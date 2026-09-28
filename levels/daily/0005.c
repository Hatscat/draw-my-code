int f(int x, int y) {
  // one compare instead of two
  unsigned u = x - 2, v = y - 3;
  return u < 2 || v < 2 ? 1 : 2;
}
