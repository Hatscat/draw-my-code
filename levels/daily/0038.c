int f(int x, int y) {
  int n = 8*y + x, d = 2;
  while (d < 8 && n % d != 0)
    d++;
  return d % 8;
}
