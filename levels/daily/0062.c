int f(int x, int y) {
  int h[] = {4,0,0,7,2,0,0,5};
  int n = 8;
  for (int i = 0; i < n; i++)
    if (h[i] == 0) {
      for (int j = i; j < n-1; j++)
        h[j] = h[j + 1];
      n--;
    }
  if (x >= n) return 0;
  return h[x] > 7 - y ? h[x] : 0;
}
