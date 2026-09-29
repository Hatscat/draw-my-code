int f(int x, int y) {
  // cut off the biggest square
  int w = 8, h = 5, s;
  while (y < h) {
    s = min(w, h);
    if (x < s && y < s)
      return s;
    if (w > h) x -= s, w -= s;
    else y -= s, h -= s;
  }
  return 0;
}
