int f(int x, int y) {
  // move to the center of this plus
  int c = (x + 2*y) % 5;
  x += (c == 4) - (c == 1);
  y += (c == 3) - (c == 2);
  return (x + y) % 2 ? 2 : 0;
}
