int f(int x, int y) {
  int dx = abs(2*x - 7);
  int dy = abs(2*y - 7);
  return max(dx, dy) / 2;
}
