int f(int x, int y) {
  if (x == 0)
    return 1;
  if (y == 0)
    return 0;
  int a = f(x, --y);
  int b = f(--x, y);
  return (a + b) % 8;
}
