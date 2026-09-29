int f(int x, int y) {
  int dx = 2*x - 7, dy = 2*y - 7;
  int c = 0;
  if (dx < 0) c += 4;
  if (dy < 0) c += 2;
  if (abs(dx) < abs(dy)) c += 1;
  return c;
}
