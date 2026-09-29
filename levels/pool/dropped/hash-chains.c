int f(int x, int y) {
  // key k goes to the end of chain
  // k % 8; the cell shows k / 8
  int key[] = {21, 13, 44, 29, 36,
    52, 12, 45, 11, 60, 37, 23, 30};
  int n = 0;
  for (int i = 0; i < 13; i++)
    if (key[i] % 8 == x && n++ == y)
      return key[i] / 8;
  return 0;
}
