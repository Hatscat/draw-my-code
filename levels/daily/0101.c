int f(int x, int y) {
  // as merge sort after y/2 passes
  int a[] = {6,2,4,6,2,2,6,4};
  int w = 1 << y/2;
  for (int i = 1; i < 8; i++)
    for (int j = i; j % w; j--)
      if (a[j-1] > a[j]) {
        int t = a[j];
        a[j] = a[j-1], a[j-1] = t;
      }
  return a[x];
}
