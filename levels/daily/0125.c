int f(int x, int y) {
  if (x == 0 || y == 0)
    return 1;
  int left = f(x - 1, y);
  int up = f(x, y - 1);
  int diag = f(x - 1, y - 1);
  return (left + up + diag) % 8;
}
