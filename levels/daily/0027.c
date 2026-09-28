int f(int x, int y) {
  int dx = abs(2*x - 7);
  if (dx > 2*y + 3)
    return 0;
  if (y == 7 && x % 3 == 1)
    return 0;
  int eye = x%4 == 1 || x%4 == 2;
  if ((y == 2 || y == 3) && eye)
    return y > 2 && x%4 > 1 ? 6 : 1;
  return 2;
}
