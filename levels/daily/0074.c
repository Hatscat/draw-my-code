int f(int x, int y) {
  // red plays first
  long long m = 62665655443;
  int h = 0, t = 0;
  for (; m > 0; m /= 10, t++)
    if (m % 10 == x && ++h == 8 - y)
      return t % 2 ? 4 : 2;
  return 0;
}
