int f(int x, int y) {
  unsigned u = 2*x - 7, v = 2*y - 7;
  if (u*u + 4*(v + 3)*(v + 3) < 20)
    return 6;
  if (y == 3 && u*u == 9)
    return 4;
  if (u*u + 9*(v + 1)*(v + 1) < 60)
    return 7;
  if (y < 5)
    return 0;
  return u*u < (v - 1)*(v - 1);
}
