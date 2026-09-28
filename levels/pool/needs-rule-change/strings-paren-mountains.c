int f(int x, int y) {
  char *s = "((())())";
  int h = 0;
  for (int i = 0; i <= x; i++)
    h += s[i] == '(' ? 2 : -2;
  int b = 7 - y; // height
  if (b >= h) return 6;
  if (b >= 4) return 1;
  return 5;
}
