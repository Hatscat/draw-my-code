int f(int x, int y) {
  int r[] = {
    0,0,7,7,6, 5,1,6,2,4,
    0,5,7,7,5, 1,3,3,6,3};
  int c = 0;
  for (int i = 0; i < 20; i += 5)
    if (x >= r[i] && x <= r[i+2] &&
      y >= r[i+1] && y <= r[i+3])
      c = r[i+4];
  return c;
}
