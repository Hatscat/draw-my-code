int f(int x, int y) {
  // how many 1 bits?
  int bx = x%2 + x/2%2 + x/4;
  int by = y%2 + y/2%2 + y/4;
  return bx == by ? 4 + bx : 0;
}
