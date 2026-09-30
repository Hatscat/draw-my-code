int f(int x, int y) {
  // bit x is set if seat x is taken
  // you get the first free seat
  unsigned r[] = {0, 0, 0x07, 0x3F,
    0x0B, 0x67, 0x1D, 0xDF};
  if (y == 0)
    return 1;
  unsigned you = ~r[y] & (r[y] + 1);
  if (you >> x & 1)
    return 5;
  return r[y] >> x & 1 ? 2 : 0;
}
