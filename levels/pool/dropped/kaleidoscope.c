int f(int x, int y) {
  int q[4][4] = {
    {4, 2, 2, 2},
    {2, 2, 0, 0},
    {2, 0, 5, 0},
    {2, 0, 0, 0},
  };
  int i = abs(2*y - 7) / 2;
  int j = abs(2*x - 7) / 2;
  return q[i][j];
}
