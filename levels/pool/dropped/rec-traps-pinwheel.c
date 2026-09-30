int f(int x, int y) {
  int row = y, col = x;
  if (col > 3)
    return f(row, 7 - col);
  if (row > 3)
    return f(7 - row, col);
  if (row == 3 && col == 3)
    return 4;
  return col >= row ? 2 : 0;
}
