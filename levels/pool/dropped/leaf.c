int f(int x, int y) {
  int u = 2*x - 7, v = 2*y - 7;
  // pins at (-2, -4) and (2, 4)
  int a = (u+2)*(u+2) + (v+4)*(v+4);
  int b = (u-2)*(u-2) + (v-4)*(v-4);
  // is sqrt(a) + sqrt(b) <= 13?
  int s = 13*13 - a - b;
  int vein = abs(2*u - v) < 3;
  if (s >= 0 && 4*a*b <= s*s)
    return vein ? 1 : 5;
  return vein && v > 0 ? 3 : 0;
}
