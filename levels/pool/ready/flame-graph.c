int f(int x, int y) {
  // flame graph of f(5, 8): one
  // column per leaf, the root below
  if (y > 7)
    return x < 2 ? x
      : f(x - 1, 8) + f(x - 2, 8);
  int n = 5;
  for (; y < 7 && n > 1; y++)
    if (x < f(n, 8)) n--;
    else x -= f(n, 8), n -= 2;
  return y < 7 ? 0 : n + 2;
}
