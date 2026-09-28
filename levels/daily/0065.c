int f(int x, int y) {
  int m = y + 2, p = 1;
  for (int i = 2; i <= x; i++)
    p = p * i % m;
  return p;
}
