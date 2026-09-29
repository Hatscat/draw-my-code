int f(int x, int y) {
  if (x == 2 || y == 5)
    return 0;
  return x < 2
    ? y == 2 ? 0 : y < 5 ? 1 : 6
    : y < 5 ? 2
    : x == 6 ? 0 : x < 6 ? 1 : 4;
}
