int f(int x, int y) {
  // y steps, up to x + 1 at a time
  int ways = y == 0;
  for (int k = 1; k <= x + 1; k++)
    if (k <= y)
      ways += f(x, y - k);
  return ways % 8;
}
