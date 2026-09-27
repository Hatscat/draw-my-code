int f(int x, int y) {
  return y < 0 ? 0 : f(x, y + 1) - 1;
}
