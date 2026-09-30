int f(int x, int y) {
  // midpoint displacement: f(x, 8)
  // is the height of column x
  int d[] = {1,1,2,2,4,0,1,0,2};
  int s = x % 2 ? 1 : x % 4 ? 2 : 4;
  if (y < 8)
    return f(x, 8) <= 7 - y ? 0
      : y < 4 ? 1 : 5;
  if (x % 8 == 0) return d[x];
  int a = f(x-s, 8), b = f(x+s, 8);
  return (a + b) / 2 + d[x];
}
