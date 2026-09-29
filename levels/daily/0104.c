int f(int x, int y) {
  // a min-heap: n's parent is n/2
  int a[] = {0, 4,5,2,6,7,7,3,
    1,7,6,7,5,7,6,6};
  for (int i = 2; i < 16; i++) {
    int n = i, t = a[i];
    while (a[n/2] > t)
      a[n] = a[n/2], n /= 2;
    a[n] = t;
  }
  return a[(8 + x) >> (3 - y/2)];
}
