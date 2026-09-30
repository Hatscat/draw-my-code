int f(int x, int y) {
  // steps to you, to the treasure
  int d = abs(x - 1) + abs(y - 5);
  int e = abs(x - 5) + abs(y - 2);
  int land = d < 2 || e < 3;
  int c = land ? 5 : 6;
  if (!e) c = 2;
  if (!d) c = 1;
  int fog = d > 2;
  if (~fog) return c;
  return 0;
}
