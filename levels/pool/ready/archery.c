int f(int x, int y) {
  int dx = 2*x - 7, dy = 2*y - 7;
  int d = dx*dx + dy*dy, r = 0;
  while ((r + 1) * (r + 1) <= d)
    r++;
  // gold, red, blue, black, white
  int ring[] = {4, 2, 6, 0, 1};
  return ring[r / 2];
}
