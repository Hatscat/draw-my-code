int f(int x, int y) {
  int c = 0, h = x*x + y*y;
  while ((c + 1) * (c + 1) <= h)
    c++;
  return min(c, 7);
}
