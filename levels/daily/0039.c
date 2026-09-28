int f(int x, int y) {
  // one hex digit per half row
  int s = 0x4EF717F6;
  int c = min(x, 7 - x);
  int bit = 4*(7 - y) + 3 - c;
  if (s >> bit & 1)
    return c == 3 ? 7 : 3;
  return 0;
}
