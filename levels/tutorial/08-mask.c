int f(int x, int y) {
  // do not calculate, it is visual
  // 1 is at position x in the int,
  // notice the direction
  int b = 1 << x;
  // hexadecimal mask of 8 bits,
  // same as the number of columns
  int mask = 0xB0; // 10110000
  // "&" keeps the "1" bits in both
  return b & mask ? 1 : 0;
}
