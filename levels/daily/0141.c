int f(int x, int y) {
  int u = abs(2*x - 7);
  if (y == 0) return u < 2 ? 2 : 0;
  if (u < 2 && y > 5) return y - 3;
  if (u < 2 && abs(2*y - 5) < 2)
    return 6;
  if (u < 4 && y < 6) return 1;
  if (u > 3 && u < 2*y - 2 && y < 7)
    return 2;
  return 0;
}
