int f(int x, int y) {
  enum { U = -4, D = 4,
    L = -1, R = 1 };
  int mv[] = {U,U,L,L,D,R,U,U};
  int b[16], g = 15; // g: the gap
  for (int i = 0; i < 16; i++)
    b[i] = i;
  for (int i = 0; i < 8; i++)
    b[g] = b[g + mv[i]], g += mv[i];
  int p = y/2*4 + x/2;
  return p == g ? 0 : b[p]/4 + 2;
}
