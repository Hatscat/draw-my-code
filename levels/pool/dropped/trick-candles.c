int f(int x, int y) {
  int lit = 1, glow = 4;
  lit = ~lit; // make a wish
  if (!lit) glow = 0;
  int u = abs(2*x - 7);
  if (y > 3 && u < 7)
    return y == 4 ? 1 : 2;
  if (u == 3 && y > 1) return 6;
  if (u == 3 && y == 1 && glow)
    return 3;
  return glow;
}
