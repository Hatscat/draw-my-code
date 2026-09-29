int f(int x, int y) {
  int p = 0;
  while (y > 0) {
    if (y % 2)
      p += x;
    x *= 2;
    y /= 2;
  }
  return p / 7;
}
