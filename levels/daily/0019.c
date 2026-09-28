int f(int x, int y) {
  int charge = 80; // percent
  int bars = charge / 100 * 5;
  int ink = bars < 2 ? 2 : 1;
  if (y < 2 || y > 5)
    return 0;
  if (x == 7)
    return (y == 3 || y == 4) * ink;
  if (x % 6 == 0 || y % 3 == 2)
    return ink;
  return x <= bars ? 5 : 0;
}
