int f(int x, int y) {
  int w = abs(2*x - 7);
  if (y == 7)
    return w == 1 ? 3 : 0;
  if (w > y + 1)
    return 0;
  if (y == 0)
    return 4;
  return (x + 2*y) % 5 ? 5 : 2;
}
