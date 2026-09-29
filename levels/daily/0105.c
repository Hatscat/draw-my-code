int f(int x, int y) {
  // number the cells along a spiral
  // from the top left, 8 per color
  int r = min(x, y);
  r = min(r, 7 - max(x, y));
  int s = 7 - 2*r, n = 4*r*(8 - r);
  x -= r, y -= r;
  n += y == 0 ? x : x == s ? s + y
    : y == s ? 3*s - x : 4*s - y;
  return n / 8;
}
