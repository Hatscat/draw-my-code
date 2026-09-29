int f(int x, int y) {
  int seg[] = {07000000, 04444000,
    01111000, 00007000, 00004444,
    00001111, 00000007}, px = 0;
  x = 7 - x, y = 7 - y; // flip it
  int on = x < 4 ? 0x24 : 0x2E;
  for (int k = 0; k < 7; k++)
    if (on >> k & 1)
      px |= seg[k];
  if (x%4 == 3 || y == 7) return 0;
  return px >> (20 - 3*y - x%4) & 1;
}
