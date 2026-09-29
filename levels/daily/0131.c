int f(int x, int y) {
  int wing[] = {0xE0, 0xF0, 0xF0,
    0x70, 0x10, 0x70, 0x60, 0};
  int row[8], w = wing[y], i;
  for (i = 0; i < 8; i++, w /= 2)
    row[i] = w % 2;
  for (i = 0; i < 8; i++)
    row[i] = row[7 - i];
  return row[x] ? 7 : 0;
}
