int f(int x, int y) {
  int a = abs(2*x - 7);
  int b = abs(2*y - 7);
  if (a < 2 || b < 2) return 2;
  if (a == b) return 1;
  return 6;
}
