int f(int x, int y) {
  int u = abs(2*x - 7);
  int v = abs(2*y - 7);
  // four ways to be at most 7 away
  if (u + v <= 7) return 2;
  if (u*u + v*v <= 7*7) return 3;
  if (u*u*u*u + v*v*v*v <= 7*7*7*7)
    return 4;
  return 6;
}
