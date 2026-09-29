int f(int x, int y) {
  enum { V = 1, H = 2 };
  int t = 0;
  if (x % 4 < 2)
    t |= V;
  if (y % 4 < 2)
    t |= H;
  if (t & V & H)
    return 5;
  return t & V ? 4 : t ? 6 : 1;
}
