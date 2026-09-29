int f(int x, int y) {
  // draw my code
  int w[] = {21,17,36,9,21,13,18,1};
  x *= 4;
  if (x < 2 && y % 7)
    return 0;
  return x < w[y];
}
