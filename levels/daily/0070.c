int f(int x, int y) {
  int r = min(x, y);
  r = min(r, 7 - max(x, y));
  int wall = r % 2 == 0;
  int door = x == r && y == r + 1;
  return wall != door ? 5 : 0;
}
