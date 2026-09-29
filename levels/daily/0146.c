int f(int x, int y) {
  // z = u + iv, with v pointing up
  int u = 2*x - 7, v = 7 - 2*y;
  int d = u*u + v*v;
  if (d <= 2) return 7;
  if (d <= 10 || d > 64) return 4;
  // the imaginary part of z*z*z
  int im = 3*u*u*v - v*v*v;
  return im > 0 ? 7 : 4;
}
