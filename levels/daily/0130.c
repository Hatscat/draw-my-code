int f(int x, int y) {
  int n = 8*y + x;
  for (int d = 2; d * d <= n; d++)
    if (n % (d * d) == 0)
      return d;
  return 0;
}
