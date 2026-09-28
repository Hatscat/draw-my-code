int f(int x, int y) {
  int c = y % 2 ? 1 : 2;
  if (x < 4 && y < 4) {
    int c = 6;
    if ((x + y) % 2) return c;
  }
  return c;
}
