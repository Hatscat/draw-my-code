int f(int x, int y) {
  int dx = abs(2*x - 7);
  int dy = abs(2*y - 7);
  int d = min(dx, dy);
  if (d < 5)
    return 3;
  else if (d < 3)
    return 2;
  return 6;
}
