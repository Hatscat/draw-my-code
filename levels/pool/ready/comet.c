int f(int x, int y) {
  // a comet and its tail
  if (x > 7 || y > 7)
    return 0;
  if (x/2 == 3 && y/2 == 2)
    return 4;
  return f(x + 1, y + 1)
    || f(x + 2, y + 1);
}
