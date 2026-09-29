int f(int x, int y) {
  // 8*8 = 4*5*3 + 2*2
  if (x < 5 && y < 3) return 2;
  int u = 2*x - 7, v = 2*y - 7;
  if (abs(u) == 1 && abs(v) == 1)
    return 1;
  // turn a quarter, next color
  return f(y, 7 - x) + 1;
}
