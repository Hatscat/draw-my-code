int f(int x, int y) {
  // f(n, 8), f(n, 9): Hofstadter's
  // Female and Male sequences
  if (y > 7 && x == 0)
    return y == 8;
  if (y > 7)
    return x - f(f(x-1, y), 17 - y);
  if (y < f(x, 8)) return 2;
  return 7 - y < f(x, 9) ? 6 : 0;
}
