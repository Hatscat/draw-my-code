int f(int x, int y) {
  // 2 bits a move: 0> 1v 2< 3^
  unsigned m = 0xFA5500FF;
  int i = 0, u = 2, v = 6;
  for (; i < 16; i++, m >>= 2) {
    if (u == x && v == y)
      return 2 + i/4;
    u += (m%4 == 0) - (m%4 == 2);
    v += (m%4 == 1) - (m%4 == 3);
  }
  return u == x && v == y ? 7 : 0;
}
