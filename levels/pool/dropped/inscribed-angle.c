int f(int x, int y) {
  // angle APB: A(3, 2), B(4, 5)
  int ax = 3 - x, ay = 2 - y;
  int bx = 4 - x, by = 5 - y;
  int dot = ax*bx + ay*by;
  int cross = abs(ax*by - ay*bx);
  if (dot < 0) return 2;
  if (dot == 0) return 1;
  return cross >= dot ? 4 : 0;
}
