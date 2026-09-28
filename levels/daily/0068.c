int f(int x, int y) {
  int cx = min(max(x, 2), 5);
  int cy = max(min(y, 2), 5);
  int dx = x - cx, dy = y - cy;
  return dx*dx + dy*dy < 5 ? 6 : 1;
}
