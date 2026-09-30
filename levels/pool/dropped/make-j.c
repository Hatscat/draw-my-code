int f(int x, int y) {
  // make -j; job y needs jobs e[y]
  int d[] = {3,2,2,3,1,4,1,1};
  int e[] = {0,0,1,2,12,2,16,96};
  int s = 0; // f(8, y): y's start
  for (int j = 0; j < 8; j++)
    if (e[y] >> j & 1)
      s = max(s, f(8, j) + d[j]);
  if (x > 7) return s;
  return x >= s && x < s + d[y]
    ? y % 7 + 1 : 0;
}
