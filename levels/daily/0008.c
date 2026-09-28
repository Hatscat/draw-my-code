int f(int x, int y) {
  int d = abs(x - 3) + abs(y - 4);
  return 5 - min(d, 5);
}
