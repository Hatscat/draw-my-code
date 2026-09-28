int f(int x, int y) {
  int qx = abs(x-2), qy = abs(y-5);
  int kx = x - 5, ky = y - 1;
  if (qx + qy == 0) return 7;
  if (kx*kx + ky*ky == 0) return 1;
  if (kx*kx + ky*ky == 5) return 4;
  if (!qx || !qy || qx == qy)
    return 2;
  return 0;
}
