int f(int x, int y) {
  int c = 0x80 >> x, r = 0x1 << y;
  int m = 0x28;
  return (c & m) | (r & m) ? 3 : 0;
}
