int f(int x, int y) {
  double sum = 0.1 + 0.2;
  int tick = y == min(x + 4, 8 - x);
  int cross = x == y || x + y == 7;
  if (sum == 0.3) return tick * 5;
  return cross * 2;
}
