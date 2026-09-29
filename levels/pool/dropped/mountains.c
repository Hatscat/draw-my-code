int f(int x, int y) {
  int z = 7 - y;
  int h = max(6 - 2*abs(x - 2),
    5 - 2*abs(x - 5));
  if (z >= h) return 6;
  if (z > 3) return 1;
  return z ? 7 : 5;
}
