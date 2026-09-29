int f(int x, int y) {
  // each room opens north or east
  int key = 0x5C30;
  if (x == 7 || y == 7 || x & y & 1)
    return 0;
  if (x%2 == 0 && y%2 == 0)
    return 1;
  int rx = x/2, ry = (y + 1)/2;
  int bit = key >> (4*ry + rx) & 1;
  int up = ry && (rx == 3 || bit);
  return y%2 == up;
}
