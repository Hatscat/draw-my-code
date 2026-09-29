int f(int x, int y) {
  // jugs: the 3 on top, the 5 below
  int a = 0, b = 0;
  for (int s = 0; s < x; s++)
    if (!b) b = 5;
    else if (a == 3) a = 0;
    else
      b += a, a = min(3, b), b -= a;
  if (y < 3)
    return a + y > 2 ? 6 : 0;
  return b + y > 7 ? 5 : 0;
}
