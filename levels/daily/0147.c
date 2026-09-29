int f(int x, int y) {
  // math plots point up
  int h = 7 - y;
  int curve = h == x*x / 7;
  int line = h == 7 - x;
  if (curve && line) return 7;
  if (curve) return 2;
  if (line) return 6;
  return x == 0 || h == 0;
}
