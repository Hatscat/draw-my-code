int f(int x, int y) {
  // Cistercian numerals
  int g[] = {0, 0700, 0007, 0421,
    0124, 0724, 0111, 0711, 0117,
    0717}, p[] = {1,10,100,1000};
  int c = abs(2*x - 7)/2 - 1;
  int r = min(y, 7 - y);
  if (c < 0 || r > 2) return c < 0;
  int q = (x < 4) + 2*(y > 3);
  int d = 4096 / p[q] % 10;
  return g[d] >> (8 - 3*r - c) & 1;
}
