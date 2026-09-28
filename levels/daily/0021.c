int f(int x, int y) {
  int dx = 2*x - 7, dy = 2*y - 7;
  if (x == 3 && y == 1)
    return 0;
  if (dx > 0 && abs(dy) < dx)
    return x == 7 && abs(dy) == 1;
  return dx*dx + dy*dy < 64 ? 4 : 0;
}
