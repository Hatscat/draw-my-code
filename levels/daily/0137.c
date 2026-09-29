int f(int x, int y) {
  int n = 1;
  for (int i = 0; i < y; i++)
    n *= 011;
  return n >> 3*(7 - x) & 7;
}
