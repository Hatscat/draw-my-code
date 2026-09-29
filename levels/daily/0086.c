int f(int x, int y) {
  // row y: max of a[x] .. a[x + y]
  int a[] = {1,4,2,0,6,3,0,5};
  if (x + y > 7) return 0;
  int m = 0;
  for (int i = x; i <= x + y; i++)
    m = max(m, a[i]);
  return m;
}
