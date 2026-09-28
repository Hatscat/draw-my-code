int f(int x, int y) {
  int h[] = {2,5,3,7,4,6,1,3};
  for (int i = 0; i < 8; i++) {
    int t = h[i];
    h[i] = h[7 - i];
    h[7 - i] = t;
  }
  return h[x] > 7 - y ? h[x] : 0;
}
