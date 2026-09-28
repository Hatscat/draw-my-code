int f(int x, int y) {
  // one compare per range
  unsigned a = x - 3, b = y - 4;
  if (x == 2 || x == 6)
    return 0;
  if (y == 3 || y == 6)
    return 0;
  if (a < 3 && y < 3) return 2;
  if (x < 2 && b < 2) return 6;
  if (x > 6 && y > 6) return 4;
  return 1;
}
