int f(int x, int y) {
  int u = 2*x - 7, v = 2*y - 7;
  // weights of the corners (0, -7),
  // (-7, 7), (7, 7): they sum to 28
  int a = 14 - 2*v;
  int b = 7 + v - 2*u;
  int c = 7 + v + 2*u;
  if (a < 0 || b < 0 || c < 0)
    return 0;
  if (a > b && a > c) return 2;
  return b > c ? 5 : 6;
}
