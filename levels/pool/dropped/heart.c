int f(int x, int y) {
  int u = abs(2*x - 7);
  int w = u - 4, v = 2*y - 2;
  if (w*w + v*v < 13) return 2;
  if (y && u + 2*y < 17) return 2;
  return 0;
}
