int f(int x, int y) {
  // a magic square of 0..63
  int n = 8*y + x;
  int a = x % 4, b = y % 4;
  if (a != b && a + b != 3)
    n = 63 - n;
  return n / 8;
}
