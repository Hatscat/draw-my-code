int f(int x, int y) {
  // the sun is in the top left
  if (abs(2*x - 3) < y) return 4;
  if (x == 0 || y == 0) return 6;
  if (f(x-1, y-1) == 6) return 6;
  return 0;
}
