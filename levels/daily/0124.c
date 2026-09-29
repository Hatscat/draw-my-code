int f(int x, int y) {
  if (y > 3)
    f(x, 7 - y);
  int u = 2*x - 7, v = 2*y - 7;
  if (u*u + v*v < 18)
    return 4;
  int sky[] = {7,7,2,2,3,3,5,5};
  return sky[y];
}
