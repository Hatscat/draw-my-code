int f(int x, int y) {
  // two pointers look for a[i] +
  // a[j] == 8 in a sorted array
  int a[] = {1,1,1,4,4,4,6,8};
  int i = 0, j = 7, s = a[x] + a[y];
  while (a[i] + a[j] != 8) {
    if (y == i && x == j) return 7;
    a[i] + a[j] < 8 ? i++ : j--;
  }
  if (y == i && x == j) return 5;
  return s < 8 ? 0 : s > 8 ? 6 : 4;
}
