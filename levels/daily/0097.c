int f(int x, int y) {
  // L pieces tile all but (5, 2)
  if (x == 5 && y == 2) return 0;
  int u = 5, v = 2;
  for (int s = 4; ; s /= 2) {
    if (x/s != u/s || y/s != v/s)
      u = s - (x<s), v = s - (y<s);
    if (x == u && y == v)
      return s + 1;
    x %= s, y %= s, u %= s, v %= s;
  }
}
