int f(int x, int y) {
  // two stones dropped in a pond
  int a = isqrt(x*x + y*y);
  int b = isqrt((7-x)*(7-x) + y*y);
  return (a + b) % 2 ? 6 : 1;
}
