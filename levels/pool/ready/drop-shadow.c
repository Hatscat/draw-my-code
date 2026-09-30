int f(int x, int y) {
  // bit x of c[y + 1] is row y
  unsigned c[9] = {0, 0x1E, 0x33,
    0x03, 0x03, 0x33, 0x1E};
  unsigned row = c[y + 1];
  // the shadow: the row above moved
  // right, where the letter is not
  unsigned s = c[y] << 1 & ~row;
  if (s >> x & 1)
    return 7;
  return row >> x & 1 ? 4 : 0;
}
