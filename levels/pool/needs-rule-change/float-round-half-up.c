int f(int x, int y) {
  double v = 0.75 * (x - 4);
  int r = (int)(v + 0.5); // round
  if (y == 4 - r) return 1;
  return y > 4 - r ? 5 : 6;
}
