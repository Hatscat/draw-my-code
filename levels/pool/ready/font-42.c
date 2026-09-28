int f(int x, int y) {
  int font[] = {
    075557, 026227, 071747, 071717,
    055711, 074717, 074757, 071111,
    075757, 075717};
  int n = 0x2A, c = x%4, r = y - 1;
  if (c == 3 || r < 0 || r > 4)
    return 0;
  int d = x < 4 ? n / 10 : n % 10;
  int bit = 14 - 3*r - c;
  return font[d] >> bit & 1 ? 3 : 0;
}
