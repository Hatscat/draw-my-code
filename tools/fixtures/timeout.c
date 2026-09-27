int f(int x, int y) {
  int n = x;
  while (n != 5 || y < 9)
    n = (n + 1) % 8;
  return n;
}
