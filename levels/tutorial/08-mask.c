int f(int x, int y) {
  // bitwise left shift
  int b = 1 << x;
  // hexadecimal bitmask
  int mask = 0xB0; // 10110000
  return b & mask ? 1 : 0;
}
