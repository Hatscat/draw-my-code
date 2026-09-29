int f(int x, int y) {
  // a flag 8 wide and 6 tall
  if (y == 0 || y == 7) return 0;
  int u = 2*x - 7, v = 2*y - 7;
  // the cells its diagonals cross
  if (abs(4*v - 3*u) < 7) return 1;
  if (abs(4*v + 3*u) < 7) return 1;
  return 6;
}
