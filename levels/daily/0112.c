int f(int x, int y) {
  // taxis at (2, 2) and (5, 5):
  // which one gets here first?
  int a = abs(x - 2) + abs(y - 2);
  int b = abs(x - 5) + abs(y - 5);
  if (a == 0 || b == 0) return 4;
  if (a < b) return 2;
  return a > b ? 6 : 1;
}
