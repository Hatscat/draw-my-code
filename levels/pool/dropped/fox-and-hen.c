int f(int x, int y) {
  // fox at (0, 1), hen at (3, 4):
  // where is the hen first, if the
  // fox runs 2 or 3 times as fast?
  int fox = x*x + (y - 1)*(y - 1);
  int hen = (x - 3)*(x - 3)
    + (y - 4)*(y - 4);
  if (fox == 0) return 3;
  if (hen == 0) return 1;
  if (9*hen < fox) return 6;
  return 4*hen < fox ? 5 : 0;
}
