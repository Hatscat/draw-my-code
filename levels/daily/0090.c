int f(int x, int y) {
  // cameras at (0, 0) and (7, 0)
  if (x > 2 && x < 5 && y / 2 == 1)
    return 1; // a pillar
  // hidden behind it, from each one
  int w = 7 - x;
  int a = x > 2 && 3*y > x
    && 5*y < 7*x;
  int b = w > 2 && 3*y > w
    && 5*y < 7*w;
  return 2*!a + 4*!b;
}
