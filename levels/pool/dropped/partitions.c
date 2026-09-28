int f(int x, int y) {
  if (y == 0)
    return 1;
  if (x < 0 || y < 0)
    return 0;
  int a = f(x - 1, y);
  int b = f(x, y - x - 1);
  return (a + b) % 8;
}
