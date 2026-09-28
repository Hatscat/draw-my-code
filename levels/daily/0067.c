int f(int x, int y) {
  int a[] = {3,7,1,6,5,2,4,0};
  for (int p = 0; p < y; p++)
    for (int i = 0; i < 7; i++)
      if (a[i] > a[i + 1]) {
        int t = a[i];
        a[i] = a[i + 1];
        a[i + 1] = t;
      }
  return a[x];
}
