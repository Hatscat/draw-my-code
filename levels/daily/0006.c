int f(int x, int y) {
  int dx = 2*x - 7, dy = 2*y - 7;
  int d = dx*dx + dy*dy;
  int z = 7;
  while (z > 0 && d + z*z > 64)
    z--;
  return z;
}
