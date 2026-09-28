int f(int x, int y) {
  // side view, sea level at y = 5
  int top[] = {3,2,2,4,6,7,7,4};
  int g = top[x];
  if (y < g)
    return y < 5 ? 0 : 6;
  if (y == g)
    return g > 5 ? 4 : 5;
  return y < g + 3 ? 3 : 1;
}
