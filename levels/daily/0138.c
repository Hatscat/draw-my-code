int f(int x, int y) {
  int roof[] = {0,3,3,3,3,3,3,0};
  int wall[] = {6,0,6,0,0,6,0,6};
  int door[] = {6,6,6,1,1,6,6,6};
  int *row[] = {roof, wall, wall,
    wall, wall, wall, wall, door};
  for (int i = 0; i < 8; i++)
    if (row[3][i] == 0)
      row[3][i] = 4;
  return row[y][x];
}
