int f(int x, int y) {
  int n = y + 1;
  for (int i = 0; i < x; i++)
    n = n % 2 ? 3*n + 1 : n / 2;
  return n < 8 ? n : 0;
}
