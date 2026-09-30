int f(int x, int y) {
  // the Earth, on the left
  unsigned c = 6;
  if (x % 4 > 1 && y > 0 && y < 3)
    c = 4;
  if (y > 5 - (x % 4 == 1))
    c = 5;
  if (x > 3)
    c = ~c & 7;
  return c;
}
