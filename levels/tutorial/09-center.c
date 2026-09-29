int f(int x, int y) {
  // dx and dy are odd, in [-7, 7],
  // 0 is the center, between cells
  int dx = 2*x - 7, dy = 2*y - 7;
  // a negative number multiplied by
  // itself becomes positive, so
  // dx*dx and dy*dy: 1, 9, 25 or 49
  int d = dx*dx + dy*dy;
  // d: squared distance to center,
  // in half cells (Pythagoras)
  return d < 6*6 ? 2 : 0;
}
