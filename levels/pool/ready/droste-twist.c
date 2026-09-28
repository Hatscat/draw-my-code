int f(int x, int y) {
  if (x < 4 && y < 4 && x + y > 0)
    return f(2 * y, 2 * x);
  if (x < 4 && y < 4)
    return 7;
  return x < 4 ? 2 : y < 4 ? 4 : 6;
}
