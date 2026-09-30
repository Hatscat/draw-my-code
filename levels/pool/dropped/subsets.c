int f(int x, int y) {
  // v & ~u: the bits of v not in u
  unsigned u = x, v = y;
  int down = (v & ~u) == 0;
  int up = (u & ~v) == 0;
  return down + 2*up;
}
