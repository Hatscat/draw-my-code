int f(int x, int y) {
  // four planks: a cell shows the
  // nearest one, with the least z
  int c = 0, z = 9;
  if (x % 4 == 1 || x % 4 == 2)
    c = x < 4 ? 6 : 5, z = 0;
  // the planks across are tilted
  int t = y < 4 ? 2*x - 7 : 7 - 2*x;
  int h = y % 4 == 1 || y % 4 == 2;
  if (h && t < z) c = y < 4 ? 2 : 4;
  return c;
}
