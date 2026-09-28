int f(int x, int y) {
  int n = 8*y + x;
  while (n > 7)
    n = n / 8 + n % 8;
  return n;
}
