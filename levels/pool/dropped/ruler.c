int f(int x, int y) {
  // u & ~(u - 1) keeps the lowest 1
  unsigned u = x + 8;
  int tick = u & ~(u - 1);
  if (y > 5)
    return 0;
  return y < tick ? 1 : 4;
}
