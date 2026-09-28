int f(int x, int y) {
  unsigned char a = 32 * x;
  unsigned char b = 32 * y;
  unsigned char s = a + b;
  if (a + b < a) return 7; // wrap?
  if (s < a) return 2;     // wrap?
  return s == 224 ? 4 : 5;
}
