int f(int x, int y) {
  // go to this hexagon's center
  int c = (x + 3*y) % 7;
  int p[] = {0, -1, 1, 0, 0, -1, 1};
  int q[] = {0, 0, -1, -1, 1, 1, 0};
  x += p[c], y += q[c];
  int color[] = {0, 4, 6};
  return color[(2*x + y) % 3];
}
