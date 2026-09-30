int f(int x, int y) {
  // a gentleman
  int u = abs(2*x + ~6);
  if (y == 1) return 0;
  if (y == 0) return u < 5 ? 0 : 6;
  if (u == 7) return 6;
  if (y == 3 && u == 3) return 0;
  if (y == 4 && u == 5) return 0;
  if (y == 5) return 0;
  return y == 6 && u == 1 ? 2 : 3;
}
