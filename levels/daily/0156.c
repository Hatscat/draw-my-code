int f(int x, int y) {
  // corners (0, 0), (7, 3), (3, 7);
  // area 20 = inside + border/2 - 1
  int a = 7*y - 3*x;
  int b = 10 - x - y;
  int c = 7*x - 3*y;
  if (a < 0 || b < 0 || c < 0)
    return 0;
  // n: how many sides it lies on
  int n = !a + !b + !c;
  return n ? 5 + n : 4;
}
