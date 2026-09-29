int f(int x, int y) {
  int dx = 2*x - 5, dy = 2*y - 7;
  int disc = dx*dx + dy*dy < 30;
  int low = y > 3;
  return low != disc ? 2 : 1;
}
