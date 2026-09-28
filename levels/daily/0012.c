int f(int x, int y) {
  int z = (x + y) & 0xA8;
  int w = y*y*y + x*x*x;
  int u = z ^ w;
  int v = (u << 3) & 7;
  return v | y;
}
