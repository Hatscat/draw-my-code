int f(int x, int y) {
  // day 1: just turned over
  int a = abs(2*x - 7);
  int b = abs(2*y - 7);
  if (b == 7)
    return 3;
  if (a >= b + 2)
    return a == b + 2;
  int grain = y == 6 && a == 1;
  return y < 4 || grain ? 4 : 0;
}
