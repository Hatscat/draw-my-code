int f(int x, int y) {
  enum { C, D, E, F, G, A, B };
  int n[] = {E,E,F,G,G,F,E,D};
  if (7 - n[x] == y)
    return 2;
  return y % 2 && y < 6 ? 1 : 0;
}
