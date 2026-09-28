int f(int x, int y) {
  // 7: the player to move loses
  for (int i = 0; i <= x; i++)
    for (int j = 0; j <= y; j++) {
      int a = x - i, b = y - j;
      int ok = !a || !b || a == b;
      if (a + b && ok && f(i, j))
        return 0;
    }
  return 7;
}
