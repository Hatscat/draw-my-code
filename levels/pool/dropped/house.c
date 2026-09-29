int f(int x, int y) {
  int u = abs(2*x - 7), c = 6;
  do {
    if (u > 2*y + 1)
      continue;
    c = 2;
    if (y < 4)
      continue;
    c = u < 2 && y > 5 ? 3 : 4;
  } while (0);
  return c;
}
