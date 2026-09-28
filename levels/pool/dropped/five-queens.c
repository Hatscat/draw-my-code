int f(int x, int y) {
  // 5 queens: is any square safe?
  for (int i = 0; i < 5; i++) {
    int dx = abs(x - 2 * i % 5);
    int dy = abs(y - i);
    if (dx + dy == 0) return 7;
    if (!dx || !dy || dx == dy)
      return 0;
  }
  return 5;
}
