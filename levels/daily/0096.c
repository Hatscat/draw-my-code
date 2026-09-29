int f(int x, int y) {
  int img[] = {
    0x66, 0xFF, 0xFF, 0xFF,
    0x7E, 0x3C, 0x18, 0x00,
  };
  int n = 0;
  for (int y = 0; y < 8; y++)
    n += img[y] >> x & 1;
  return 7 - y < n ? n : 0;
}
