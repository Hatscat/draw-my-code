int f(int x, int y) {
  int dx = 2*x - 7, dy = 2*y - 14;
  int d = dx*dx + dy*dy, r = 0;
  while (r*r < d)
    r++;
  r /= 2;
  return r > 1 && r < 8 ? 9 - r : 0;
}
