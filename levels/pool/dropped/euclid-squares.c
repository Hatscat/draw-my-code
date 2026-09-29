int f(int x, int y) {
  // gcd(8, 5) above gcd(8, 3), by
  // cutting off the largest square
  int w = 8, h = 5;
  if (y >= 5) h = 3, y -= 5;
  while (1) {
    int s = min(w, h);
    if (x < s && y < s) return s;
    if (w > h) x -= s, w -= s;
    else y -= s, h -= s;
  }
}
