int f(int x, int y) {
  double hill = 3 / 4.0 * x;
  double road = 3 / 4 * x;
  int b = 7 - y; // height
  if (b <= road) return 3;
  if (b < hill) return 5;
  return 6;
}
