int f(int x, int y) {
  // one octal digit per board row
  int X = 0521, O = 0244;
  if (x % 3 == 2 || y % 3 == 2)
    return 1;
  int bit = 1 << (8 - y/3*3 - x/3);
  if (X & bit) return 2;
  return O & bit ? 6 : 0;
}
