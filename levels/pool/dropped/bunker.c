int f(int x, int y) {
  // a bomb erases its column's top
  unsigned s[] = {0x3C, 0x7E, 0xFF,
    0xFF, 0xE7, 0xC3, 0x08, 0x1C};
  int b[] = {2, 2, 6, 5, 5};
  for (int i = 0; i < 5; i++) {
    int r = 0;
    while (!(s[r] >> b[i] & 1)) r++;
    s[r] &= ~(1u << b[i]);
  }
  return s[y] >> x & 1 ? 5 : 0;
}
