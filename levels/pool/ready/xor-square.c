int f(int x, int y) {
  int dx = abs(2*x - 7);
  int dy = abs(2*y - 7);
  int d = (dx^2) + (dy^2);
  return d < 9 ? 4 : 6;
}
