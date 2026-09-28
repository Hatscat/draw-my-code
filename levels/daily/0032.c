int f(int x, int y) {
  int h[] = {3,1,0,4,2,1,5,2};
  int l = 0, r = 0, z = 7 - y;
  for (int i = 0; i < 8; i++) {
    if (i <= x) l = max(l, h[i]);
    if (i >= x) r = max(r, h[i]);
  }
  if (z < h[x]) return 3;
  return z < min(l, r) ? 6 : 0;
}
