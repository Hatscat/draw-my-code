int f(int x, int y) {
  int n = 31415926;
  for (int i = x; i < 7; i++)
    n /= 10;
  int d = n % 10;
  if (y == 2)
    return 3;
  if (y < 2)
    return y == d / 5 ? 2 : 0;
  return y - 3 == d % 5 ? 0 : 5;
}
