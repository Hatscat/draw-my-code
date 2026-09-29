int f(int x, int y) {
  // 13 = 3*3 + 2*2
  int r = (x + 5*y) % 13;
  return r % 5 > 2 ? 4 : 6;
}
