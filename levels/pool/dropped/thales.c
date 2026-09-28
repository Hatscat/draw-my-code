int f(int x, int y) {
  // A(0,5), B(5,0), P(x,y)
  int u = x * (x - 5);
  int v = (y - 5) * y;
  int dot = u + v; // PA . PB
  if (dot == 0) return 1;
  return dot < 0 ? 7 : 0;
}
