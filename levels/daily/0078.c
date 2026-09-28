int f(int x, int y) {
  int u = abs(2*x - 7);
  if (y == 7) return 6;
  if (y > 4) return u+2*y<17 ? 2:6;
  if (x == 4) return 3;
  if (x < 4) return x + y > 2;
  return x - 4 <= y / 2;
}
