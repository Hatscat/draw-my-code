int f(int x, int y) {
  int t[8];
  int k = sizeof t[y = 7 - y];
  int n = sizeof t / k;
  return x + y < n ? 6 : 1;
}
