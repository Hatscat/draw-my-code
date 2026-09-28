int f(int x, int y) {
  int u = abs(2*x - 7);
  if (y < 4) return u > 2*y+1 ? 6:2;
  if (u > 5) return 5;
  if (u < 3 && y > 4) return 3;
  if (u == 5 && y == 5) return 4;
  return 1;
}
