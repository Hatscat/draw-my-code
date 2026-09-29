int f(int x, int y) {
  // each room (odd x and y) opens
  // north or west (bit 1: north)
  int n = 0x6A93;
  if (x % 2 + y % 2 == 0) return 0;
  int u = x | 1, v = y | 1;
  int up = v > 1 && (u == 1 ||
    n >> (u/2 + v/2*4) & 1);
  if (x == u && y == v) return 1;
  if (y < v) return up;
  return !up && u > 1;
}
