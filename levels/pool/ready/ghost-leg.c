int f(int x, int y) {
  // ghost leg: under row y, a rung
  // joins line r[y] and r[y] + 1
  int r[] = {2,5,0,3,6,1,4,2};
  if (y > 7)
    return x;
  if (x == r[y])
    return f(x + 1, y + 1);
  if (x == r[y] + 1)
    return f(x - 1, y + 1);
  return f(x, y + 1);
}
