int f(int x, int y) {
  // a bell, row by row
  int w[] = {2,4,4,4,6,6,0,2};
  int n = 0;
  for (int i = 0; i <= x; i++)
    n =+ abs(2*i - 7) < w[y];
  return n;
}
