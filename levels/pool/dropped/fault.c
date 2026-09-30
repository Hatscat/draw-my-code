int f(int x, int y) {
  // layers of rock, and a fault
  int east = x > 3;
  int d = y + ~east;
  if (d < 1) return 6;
  if (d < 2) return 5;
  if (d < 4) return 3;
  return d % 2 ? 2 : 7;
}
