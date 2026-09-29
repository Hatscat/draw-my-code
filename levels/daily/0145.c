int f(int x, int y) {
  int skull[] = {0x7E, 0xFF, 0x99,
    0x99, 0xE7, 0x7E, 0x5A, 0};
  int c = 0;
  if (skull[y] >> x & 1)
    goto dead;
  while (0) {
  dead:
    c = 1;
  }
  return c;
}
