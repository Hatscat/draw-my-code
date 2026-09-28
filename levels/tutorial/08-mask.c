int f(int x, int y) {
  // bitwise left shift
  int b = 1 << x;
  // hexadecimal bitmask
  int mask = 0x5A; // 01011010
  return b & mask ? 1 : 0;
}
