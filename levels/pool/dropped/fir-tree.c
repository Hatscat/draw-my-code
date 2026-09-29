int f(int x, int y) {
  int a = abs(2*x - 7), t = y - 1;
  if (y == 0)
    return a < 2 ? 4 : 0;
  if (y == 7)
    return a < 2 ? 3 : 0;
  int w = 2*(t % 3 + t / 3) + 1;
  if (a > w)
    return 0;
  int tip = a == w && t % 3 == 2;
  return tip ? 2 : 5;
}
