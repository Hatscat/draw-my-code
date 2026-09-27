int f(int x, int y) {
  int dx = 2*x - 7, dy = 2*y - 7;
  return dx*dx + dy*dy < 40 ? 2 : 0;
}
