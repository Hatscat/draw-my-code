int f(int x, int y) {
  // selection sort, XOR swap
  int a[] = {3,1,4,5,2,6,7,7};
  for (int i = 0; i < 7; i++) {
    int m = i;
    for (int j = i + 1; j < 8; j++)
      if (a[j] < a[m]) m = j;
    a[i] ^= a[m], a[m] ^= a[i];
    a[i] ^= a[m];
  }
  return a[x] > 7 - y ? a[x] : 0;
}
