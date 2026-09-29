int f(int x, int y) {
  // Sakamoto's weekday, 0 = Sunday
  int t[] = {0, 3, 2, 5, 0, 3,
    5, 1, 4, 6, 2, 4};
  int n = 2026, m = 10;
  int w = n + n/4 - n/100 + n/400;
  w = (w + t[m - 1] + 1) % 7;
  int day = 7*y + x - w + 1;
  if (x > 6 || day < 1 || day > 31)
    return 0;
  return x % 6 ? 1 : 2;
}
