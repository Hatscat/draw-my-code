int f(int x, int y) {
  int n = x + y;
  if (n > 9)
    return n - 7;
  return f(f(n + 8, 0), 0);
}
