int f(int x, int y) {
  if (x > 3) return f(7 - x, y);
  if (y > 3) return f(x, 7 - y);
  if (x > y) return f(y, x);
  if (x == y) return 4;
  if (y == 3) return 6;
  return x;
}
