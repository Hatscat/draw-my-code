int f(int x, int y) {
  int h = 13, m = 37, s = 59;
  int d[] = {
    h / 10, h % 10, 0, m / 10,
    m % 10, 0, s / 10, s % 10
  };
  if (x % 3 == 2)
    return y % 3 == 2;
  int bit = d[x] >> (7 - y) / 2 & 1;
  return bit ? 2 + x/3*2 : 0;
}
