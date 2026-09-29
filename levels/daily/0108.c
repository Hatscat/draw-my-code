int f(int x, int y) {
  // a picket fence: sky, then grass
  int picket = x % 2 == 0 && y > 0;
  int rail = y == 2 || y == 5;
  int back = y < 4 ? 6 : 5;
  return picket + rail ? 1 : back;
}
