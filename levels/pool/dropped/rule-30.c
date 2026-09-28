int f(int x, int y) {
  // rule 30 (Wolfram, 1983)
  if (x < 0 || x > 7)
    return 0;
  if (y == 0)
    return x == 4;
  int l = f(x - 1, y - 1) > 0;
  int c = f(x, y - 1) > 0;
  int r = f(x + 1, y - 1) > 0;
  int rule[] = {0,1,1,1,1,0,0,0};
  return rule[4*l+2*c+r] * (y%7+1);
}
