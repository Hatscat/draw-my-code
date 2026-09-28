int f(int x, int y) {
  int u = 2*x - 7, v = 2*y - 7;
  int shade[] = {1, 4, 3, 2, 7};
  if (u*u + v*v > 60) return 0;
  return shade[(u + v + 14) / 6];
}
