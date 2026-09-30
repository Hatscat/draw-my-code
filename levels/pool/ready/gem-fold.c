int f(int x, int y) {
  int u = x - 4, v = y - 4;
  if (u < 0)
    u = ~u;
  if (v < 0)
    v = ~v;
  if (u + v > 3)
    return 0;
  return u + v == 3 ? 6 : 4 + u % 2;
}
