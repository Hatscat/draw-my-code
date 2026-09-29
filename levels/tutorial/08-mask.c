int f(int x, int y) {
  // do not calculate, it is visual
  // 1 is at the x pos in the int,
  // notice the direction
  int b = 1 << x;
  // hexadecimal mask on 8 bits,
  // like the number of columns
  int mask = 0xB0; // 10110000
  // "&" filter the "1" bits in both
  return b & mask ? 1 : 0;
}
