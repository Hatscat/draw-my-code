int f(int x, int y) {
  return y ? f(y, x % y) : x;
}
