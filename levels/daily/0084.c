int f(int x, int y) {
  int a = abs(2*x - 7), b = 9 - 2*y;
  if (y < 5) {
    if (a*a + b*b > 82)
      return 0;
    return (a + y) % 4 ? 2 : 1;
  }
  if (a > 3)
    return 0;
  return a > 1 || y > 5;
}
