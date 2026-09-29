int f(int x, int y) {
  // the 64 = 65 puzzle: cut along
  // (3, 0)-(5, 5) and (0, 5)-(8, 8)
  int u = 2*x + 1, v = 2*y + 1;
  if (y < 5)
    return 5*(u - 6) < 2*v ? 2 : 6;
  return 8*(v - 10) > 3*u ? 5 : 4;
}
