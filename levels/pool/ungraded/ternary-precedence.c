int f(int x, int y) {
  int stripe = y % 2;
  int light = x > y;
  return stripe + light ? 6 : 3;
}
