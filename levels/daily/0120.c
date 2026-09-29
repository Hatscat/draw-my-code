int f(int x, int y) {
  int a = x - y, b = x + y - 7;
  if (a == 0 || b == 0)
    return 4;
  return (a > 0) == (b < 0) ? 5 : 0;
}
