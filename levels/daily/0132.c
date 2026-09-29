int f(int x, int y) {
  // read the row above out loud
  long long n = 1, m, p;
  for (int r = 0; r < y; r++, n = m)
    for (m = 0, p = 1; n; p*=100) {
      m += n % 10 * p;
      while (n % 10 == m / p % 10)
        n /= 10, m += 10*p;
    }
  while (x++ < 7) n /= 10;
  return n % 10;
}
