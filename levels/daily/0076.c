int f(int x, int y) {
  int cx[] = {1,2,0,1,2,5,5,5};
  int cy[] = {0,1,2,2,2,4,5,6};
  int n = 0, a = 0;
  for (int k = 0; k < 8; k++) {
    int dx = abs(x - cx[k]);
    int dy = abs(y - cy[k]);
    if (dx + dy == 0) a = 1;
    else n += dx < 2 && dy < 2;
  }
  return 4*(n == 3 || n+a == 3) + a;
}
