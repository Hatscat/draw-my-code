int f(int x, int y) {
  int a = 0, b = 1;
  for (int i = 0; i < 8*y+x; i++) {
    int next = (a + b) % 8;
    a = b;
    b = next;
  }
  return a;
}
