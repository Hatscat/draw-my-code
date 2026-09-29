int f(int x, int y) {
  // Euclid: cut the biggest square
  // off what is left of 8 by 5
  if (y > 4) return 0;
  for (int u = 0, v = 0; ; ) {
    int s = min(8 - u, 5 - v);
    if (s == 5 - v) u += s;
    else v += s;
    if (x < u || y < v) return s;
  }
}
