int f(int x, int y) {
  // steps from (3, 1), not through
  // the wall on row 3, x = 1 to 6
  int wall = x > 0 && x < 7;
  if (y == 3 && wall) return 1;
  int d = abs(x - 3) + abs(y - 1);
  // below it: around an end first
  if (y > 3 && wall)
    d = y - 1 + min(3 + x, 11 - x);
  if (d == 0) return 4;
  return d < 5 ? 6 : d < 9 ? 5 : 0;
}
