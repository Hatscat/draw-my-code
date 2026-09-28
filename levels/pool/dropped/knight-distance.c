int f(int x, int y) {
  int d[64] = {0}, n;
  for (n = 1; n < 64; n++) d[n] = 9;
  for (n = 0; n < 6 * 4096; n++) {
    int i = n % 64, j = n / 64 % 64;
    int dx = i % 8 - j % 8;
    int dy = i / 8 - j / 8;
    if (abs(dx * dy) == 2)
      d[j] = min(d[j], d[i] + 1);
  }
  return d[x + 8 * y];
}
