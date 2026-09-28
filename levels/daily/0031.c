int f(int x, int y) {
  int u = 2*x - 8, v = 2*y - 7;
  int s = u - 4, t = v + 2;
  if (x == 6 && y == 1) return 1;
  if (u*u + v*v > 58) return 6;
  if (s*s + t*t < 40) return 6;
  return 4;
}
