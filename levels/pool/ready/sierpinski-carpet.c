int f(int x, int y) {
  while (x > 0 || y > 0) {
    if (x % 3 == 1 && y % 3 == 1)
      return 0;
    x /= 3;
    y /= 3;
  }
  return 6;
}
