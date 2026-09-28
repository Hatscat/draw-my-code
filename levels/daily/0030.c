int f(int x, int y) {
  int dx = abs(x - 3);
  int dy = abs(y - 4);
  if (dx + dy == 0) return 1;
  if (dx * dy == 2) return 2;
  if (dx == dy || !dx || !dy)
    return 7;
  return 0;
}
