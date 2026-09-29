int f(int x, int y) {
  int t = abs(2*y - 7);
  // the Y's center line
  int c = x < 4 ? 7 - 2*x : 1;
  int e = abs(t - c);
  if (e == 0) return 5;
  if (t < c) return e == 2 ? 4 : 0;
  if (e == 2) return 1;
  return y < 4 ? 2 : 6;
}
