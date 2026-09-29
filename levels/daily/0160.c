int f(int x, int y) {
  // split a square in 4 until it is
  // all in or all out of x + y < 7
  for (int s = 8; ; s /= 2) {
    int u = x/s*s, v = y/s*s;
    if (u + v + 2*s < 9)
      return 8 - s;
    if (u + v > 6)
      return s / 2;
  }
}
