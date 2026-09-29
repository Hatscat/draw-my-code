int f(int x, int y) {
  int face[3][3] = {
    {2, 2, 4},
    {6, 1, 5},
    {3, 3, 5},
  };
  if (x % 3 == 2 || y % 3 == 2)
    return 0;
  return face[2 - x/3][y/3];
}
