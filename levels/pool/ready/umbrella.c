int f(int x, int y) {
  int u = abs(2*x - 7);
  int d[] = {0, -1, 1};
  if (u < 7 && y == 2 + (u > 1))
    return 2;
  for (int i = 0; y && i < 3; i++)
    if (f(x + d[i], y - 1) == 6)
      return 6;
    else
      return 0;
  return y ? 0 : 6;
}
