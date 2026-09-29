int f(int x, int y) {
  // distance on a hex board
  int q = x - 3, r = y - 4;
  int d = max(abs(q), abs(r));
  d = max(d, abs(q + r));
  return d < 4 ? 7 - d : 0;
}
