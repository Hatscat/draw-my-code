int f(int x, int y) {
  // octal: one digit, one color
  int boat[] = {
    000010000, 000014000, 000014400,
    000014440, 000014444, 033333333,
    063333336, 066666666,
  };
  return boat[y] >> 3 * x & 7;
}
