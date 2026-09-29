int f(int x, int y) {
  // one queen per row
  int q = y < 4 ? 2*y : 2*y - 7;
  if (x != q) return 0;
  for (int r = 0; r < 8; r++) {
    int c = r < 4 ? 2*r : 2*r - 7;
    int d = abs(c - x);
    if (r != y && d == abs(r - y))
      return 2;
  }
  return 1;
}
