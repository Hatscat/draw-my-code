int f(int x, int y) {
  // row y: y beats over 8 steps,
  // spread as evenly as possible
  return x*y % 8 < y ? y : 0;
}
