int f(int x, int y) {
  if (y == 0)
    return (x + 1) % 8;
  if (x == 0)
    return f(1, y - 1);
  return f(f(x - 1, y), y - 1);
}
