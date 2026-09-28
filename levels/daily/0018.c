int f(int x, int y) {
  int piece[] = {
    0xF0, 0xC6, 0x2E, 0x66,
    0x6C, 0x8E, 0xE4, 0x00
  };
  int k = x/4 + y/2*2;
  int bit = 0x80 >> (y%2*4 + x%4);
  return piece[k] & bit ? k + 1 : 0;
}
