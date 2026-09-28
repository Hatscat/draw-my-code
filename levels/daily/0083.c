int f(int x, int y) {
  int a = x, b = y;
  for (int i = 0; i < 6; i++) {
    int c = (a + b) % 8;
    a = b;
    b = c;
  }
  return a * b % 8;
}
