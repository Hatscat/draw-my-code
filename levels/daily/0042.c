int f(int x, int y) {
  int g[] = {31415926, 27182818,
    16180339, 14142135, 17320508,
    69314718, 22360679, 11235813};
  int s = g[7], d = g[y], c = 0;
  for (int i = x; i < 7; i++)
    d /= 10;
  for (int i = 7; s; i--, s /= 10)
    if (s % 10 == d % 10)
      c = max(c, i == x ? 5 : 4);
  return c;
}
