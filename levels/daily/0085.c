int f(int x, int y) {
  // distance to the cross
  int a = abs(2*x - 5);
  int d = min(a, abs(2*y - 7));
  if (d < 2) return 6;
  return d < 4 ? 1 : 2;
}
