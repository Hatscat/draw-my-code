int f(int x, int y) {
  int lo = 0, hi = 7, s = 1, m;
  do {
    m = (lo + hi) / 2;
    if (m == x)
      return m == y ? 5 : s;
    if (m < y) lo = m + 1;
    if (m > y) hi = m - 1;
    s++;
  } while (m != y);
  return 0;
}
