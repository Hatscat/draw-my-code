int f(int x, int y) {
  int d = x + y - 7;
  if (abs(d) < 2) return 0;
  if (abs(d) < 3) return 4;
  return d < 0 ? 5 : 6;
}
