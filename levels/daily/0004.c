int f(int x, int y) {
  return (x ^ y) >> 1 & 1 ? 6 : 4;
}
