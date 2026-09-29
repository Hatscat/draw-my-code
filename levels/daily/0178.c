int f(int x, int y) {
  // rays from the bottom left
  int u = 2*x + 1, v = 15 - 2*y;
  int k = (v > 3*u) + (2*v > 3*u)
    + (3*v > 2*u) + (3*v > u);
  int c[] = {5, 1, 2, 4, 6};
  return c[k];
}
