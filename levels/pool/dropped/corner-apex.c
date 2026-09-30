int f(int x, int y) {
  if (y == 0)
    return 0;
  if (x == 0)
    return 1;
  int up = f(x, y - 1);
  int diag = f(x - 1, y - 1);
  return (up + diag) % 8;
}
