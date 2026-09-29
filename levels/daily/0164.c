int f(int x, int y) {
  int u = 2*x - 7, v = 2*y - 7;
  if (abs(u) + abs(v) > 8)
    return 0;
  return 4 + u % 2 + v % 2 * 2;
}
