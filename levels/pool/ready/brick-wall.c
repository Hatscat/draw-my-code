int f(int x, int y) {
  int r = y / 3;
  if (y % 3 == 2)
    return 1;
  return (x + 2*r) % 4 == 3 ? 1 : 2;
}
