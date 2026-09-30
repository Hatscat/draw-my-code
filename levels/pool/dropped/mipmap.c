int f(int x, int y) {
  // x & ~m clears the bits of m
  unsigned m = (1u << y/2) - 1;
  return x & ~m;
}
