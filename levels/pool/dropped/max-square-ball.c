int f(int x, int y) {
  // side of the largest square of
  // ink with its corner at (x, y)
  int ink[] = {0x3C, 0x7E, 0xFF,
    0xFF, 0xFF, 0xFF, 0x7E, 0x3C};
  if (x < 0 || y < 0) return 0;
  if (!(ink[y] << x & 0x80))
    return 0;
  return 1 + min(f(x-1, y),
    min(f(x, y-1), f(x-1, y-1)));
}
