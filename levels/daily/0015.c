int f(int x, int y) {
  enum {
    SAND = 3, SUN, SKY = 6, SEA
  };
  if (y > 5) return SAND;
  if (y > 3) return SEA;
  if (abs(x - 5) + abs(y - 1) < 2)
    return SUN;
  return SKY;
}
