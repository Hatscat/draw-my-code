int f(int x, int y) {
  // 2*x - 7: 0 is the grid's center
  int dx = 2*x - 7, dy = 2*y - 7;
  return dx*dx + dy*dy < 6*6 ? 2:0;
}
