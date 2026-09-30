int f(int x, int y) {
  // bit x of row y; holes are empty
  // cells under a block
  unsigned w[] = {0, 0, 0, 0x18,
    0x3E, 0xA2, 0xEF, 0xFB};
  unsigned above = 0;
  for (int i = 0; i < y; i++)
    above |= w[i];
  if ((above & ~w[y]) >> x & 1)
    return 2;
  return w[y] >> x & 1 ? 6 : 0;
}
