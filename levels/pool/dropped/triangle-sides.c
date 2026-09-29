int f(int x, int y) {
  // sides x, y and 5: a triangle?
  if (abs(x - y) >= 5 || x + y <= 5)
    return 0;
  int m = max(max(x, y), 5);
  // squares of the two short sides,
  // minus the square of the longest
  int s = x*x + y*y + 25 - 2*m*m;
  if (s == 0) return 1;
  return s > 0 ? 5 : 2;
}
