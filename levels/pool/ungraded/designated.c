int f(int x, int y) {
  int w[8] = {
    [1] = 2, 4, 6,
    [5] = 6, 4, 2,
  };
  int dx = abs(2*x - 7);
  return dx < w[y] ? 2 : 0;
}
