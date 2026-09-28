int f(int x, int y) {
  int n = (x/4 + 1) * (y/4 + 2);
  int u = x%4 - 1, v = y%4 - 1;
  if (u > 1 || v > 1)
    return 0;
  int pip = n > 3;
  if (u == v) pip = n > 1;
  if (v == 0) pip = n == 6;
  if (u == 0) pip = v == 0 && n % 2;
  return pip ? 1 : 2;
}
