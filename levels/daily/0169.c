int f(int x, int y) {
  int u = abs(2*x - 7);
  if (y == 7) return 6;
  // the lamp shines from y = 1
  if (y < 3 && u > 4*abs(y - 1))
    return 4;
  if (y == 0) return u < 2 ? 2 : 0;
  if (u > y/2*2 - 1) return 0;
  return y % 2 ? 2 : 1;
}
