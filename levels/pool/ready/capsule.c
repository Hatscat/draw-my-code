int f(int x, int y) {
  // segment from (2, 2) to (5, 5)
  int t = min(max(x + y, 4), 10);
  int dx = 2*x - t, dy = 2*y - t;
  if (dx*dx + dy*dy > 8) return 0;
  return x + y < 7 ? 2 : 1;
}
