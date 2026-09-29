int f(int x, int y) {
  int u = 2*x - 7, v = 2*y - 7;
  int d = u*u + v*v;
  // inside the rose r = 8 |sin 2t|
  if (d*d*d <= 4*8*8*u*u*v*v)
    return u*v > 0 ? 5 : 6;
  return 0;
}
