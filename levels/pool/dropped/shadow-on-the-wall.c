int f(int x, int y) {
  // lamp at (0, 6); post at x = 2,
  // its top 1.5 above the lamp
  if (x == 0 && y == 6) return 4;
  if (x == 2 && y > 4) return 1;
  // the ray to (x, y) climbs 6 - y
  // in x columns: over the post?
  int dark = x > 2
    && 4*(6 - y) <= 3*x;
  if (x == 7) return dark ? 7 : 4;
  return dark ? 0 : 3;
}
