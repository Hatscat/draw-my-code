int f(int x, int y) {
  int p = 1;
  for (int i = 0; i < y; i++)
    p = p * x % 7;
  return p;
}
