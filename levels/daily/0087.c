int f(int x, int y) {
  int t[8];
  int k = sizeof t[y = 7 - y];
  int n = sizeof t / k;
  // half widths, top row first
  int w[] = {3,5,5,5,3,3,1,1};
  if (abs(2*x + 1 - n) > w[y])
    return 0;
  return y < 3 ? 2 : 3;
}
