int f(int x, int y) {
  int out[8] = {0}, p = 7, k = 0;
  while (k < 3 * y) {
    p = (p + 1) % 8;
    if (!out[p] && ++k % 3 == 0)
      out[p] = 1;
  }
  return out[x] ? 0 : 4;
}
