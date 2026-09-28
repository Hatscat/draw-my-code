int f(int x, int y) {
  // y perfect shuffles of 8 cards
  for (int i = 0; i < y; i++)
    x = x < 4 ? 2*x : 2*x - 7;
  return x;
}
