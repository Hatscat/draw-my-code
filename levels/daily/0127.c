int f(int x, int y) {
  // LRU cache with y + 1 slots:
  // hit (a color) or miss (black)?
  int r[] = {3,5,3,6,5,3,6,6};
  int t[8] = {0}; // last use + 1
  for (int i = 0; i < x; i++)
    t[r[i]] = i + 1;
  int p = r[x], n = 0;
  for (int q = 0; q < 8; q++)
    n += t[q] > t[p]; // used since
  return t[p] && n <= y ? p : 0;
}
