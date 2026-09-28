int f(int x, int y) {
  int c = 2;
  if (x > y || (c = 5) > 7)
    c += 2;
  return c;
}
