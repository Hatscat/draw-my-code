int f(int x, int y) {
  int a = abs(2*x - 7);
  int b = 2*y - 7, d = a*a + b*b;
  if (d > 58)
    return 0;
  if (d > 34)
    return 4;
  int leg = y < 5 ? 3 : 5;
  if (y == 2 || (y > 2 && a == leg))
    return 2;
  return 3;
}
