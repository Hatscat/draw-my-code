int f(int x, int y) {
  int n = 8*y + x;
  if (n < 2)
    return 0;
  for (int d = 2; d * d <= n; d++)
    if (n % d == 0)
      return 0;
  if (n % 6 == 1)
    return 5;
  return n % 6 == 5 ? 6 : 1;
}
