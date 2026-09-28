int f(int x, int y) {
  int t = x;
  x = y;
  y = 7 - t;
  if (x == 1) return 4;
  if (x == 0) return 0;
  if (y == 0 && x < 7) return 2;
  if (y == 3 && x < 6) return 6;
  return 0;
}
