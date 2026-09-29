int f(int x, int y) {
  // a pyramid and its reflection
  int w[8] = {
    [1] = 2, 4, 6,
    [5] = 6, 4, 2,
  };
  int dx = abs(2*x - 7);
  if (dx >= w[y])
    return 0;
  return y < 4 ? 4 : 6;
}
