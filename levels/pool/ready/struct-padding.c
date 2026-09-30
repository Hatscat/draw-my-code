int f(int x, int y) {
  // char, int, char, double, short
  unsigned size[] = {1, 4, 1, 8, 2};
  unsigned at = 8*(y%4) + x, o = 0;
  for (int i = 0; i < 5; i++) {
    unsigned n = size[i];
    o = (o + n - 1) & ~(n - 1);
    if (at < o) return 0;
    if (at < (o += n)) return i + 1;
  }
  return 0;
}
