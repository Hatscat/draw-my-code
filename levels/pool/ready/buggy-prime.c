int f(int x, int y) {
  // is n prime?
  int n = 8*y + x;
  if (n < 2)
    return 0;
  for (int d = 2; d * d < n; d++)
    if (n % d == 0)
      return 0;
  return 5;
}
