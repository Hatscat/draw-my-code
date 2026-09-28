int f(int x, int y) {
  int d = "31415926"[x] - '0';
  return 7 - y < d ? min(d, 7) : 0;
}
