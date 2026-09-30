int f(int x, int y) {
  int tulip[] = {0x5A, 0x7E, 0x7E,
    0x3C, 0x18, 0xDB, 0x7E, 0x18};
  if (!(tulip[y] << x & 0x80))
    return 0;
  unsigned red = 2, green = 5;
  unsigned m = y < 5; // the petals
  // bitwise: red where m has a 1,
  // and green where m has a 0
  return (red & m) | (green & ~m);
}
