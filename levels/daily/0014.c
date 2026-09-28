int f(int x, int y) {
  // a mine where x*y is 6 or 12
  if (x*y == 6 || x*y == 12)
    return 7;
  int n = 0;
  for (int i = x-1; i <= x+1; i++)
    for (int j = y-1; j <= y+1; j++)
      n += i*j == 6 || i*j == 12;
  return n;
}
