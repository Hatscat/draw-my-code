int f(int x, int y) {
  if (x > 3)
    return f(7 - x, y);
  if (y > 3)
    return f(x, 7 - y);
  return min(x * y, 7);
}
