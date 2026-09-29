int f(int x, int y) {
  int a = abs(2*x - 7);
  // OCT 31 == DEC 25?
  if (031 != 25)
    return a > y ? 0 : 5;
  if (y == 0)
    return x == 4 ? 5 : 0;
  if (a + abs(2*y - 8) > 11)
    return 0;
  int cut[] = {0,0,2,6,0,5,2,0};
  return cut[y] >> a/2 & 1 ? 4 : 3;
}
