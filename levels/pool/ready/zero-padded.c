int f(int x, int y) {
  int r = x*x + y*y;
  if (r < 004) return 4;
  if (r < 010) return 3;
  if (r < 020) return 2;
  if (r < 040) return 7;
  if (r < 100) return 6;
  return 0;
}
