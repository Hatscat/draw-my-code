int f(int x, int y) {
  int i = 0, j = 0;
  while (i++ < x) {}
  while (++j < y) {}
  return i == j ? 5 : i < j ? 2 : 6;
}
