int f(int x, int y) {
  // Thales: is angle APB >= 90?
  // A = (0,2), B = (5,5)
  int a = x*(x-5) + (y-2)*(y-5);
  // A = (2,2), B = (7,5)
  int b = (x-2)*(x-7) + (y-2)*(y-5);
  if (a <= 0 && b <= 0)
    return 7;
  if (a <= 0)
    return 2;
  return b <= 0 ? 6 : 0;
}
