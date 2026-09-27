int f(int x, int y) {
  int v;
  if (x > 3) v = 1;
  return v ? 2 : 5 + y % 2;
}
