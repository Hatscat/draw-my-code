int f(int x, int y) {
  // a press toggles its cell and
  // the 4 cells next to it
  int p[8] = {0, 0, 60, 60, 60, 60};
  int on = p[y] ^ p[y]<<1 ^ p[y]>>1;
  if (y > 0) on ^= p[y - 1];
  if (y < 7) on ^= p[y + 1];
  return on >> x & 1 ? 4 : 0;
}
