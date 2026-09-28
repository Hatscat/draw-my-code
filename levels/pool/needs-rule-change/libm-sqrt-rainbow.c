int f(int x, int y) {
  int dx = 2*x - 7, dy = 15 - 2*y;
  int d = dx*dx + dy*dy;
  int r = (int)sqrt(d) / 2;
  if (r < 2) return 0;
  return 9 - min(r, 7);
}
