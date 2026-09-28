int f(int x, int y) {
  int dx = 2*x - 7, dy = 2*y - 7;
  if (dx*dx + dy*dy > 64) return 0;
  if (dx > abs(dy)) return 0;
  if (x == 3 && y == 1) return 0;
  return 4;
}
