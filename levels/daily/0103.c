int f(int x, int y) {
  int sx = -1, sy = -1;
  for (int j = 0; j < 8; j++)
    for (int i = 0; i < 8; i++)
      if (i*j % 7 == 5) {
        sx = i, sy = j;
        break;
      }
  if (x == sx && y == sy) return 4;
  if (x == sx || y == sy) return 2;
  return x*y % 7 == 5;
}
