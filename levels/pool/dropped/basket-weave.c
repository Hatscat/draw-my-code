int f(int x, int y) {
  int row = y, col = x;
  if (col > 3)
    return f(row, col - 4);
  if (row > 3)
    return f(row - 4, col);
  return row % 2 ? 6 : 3;
}
