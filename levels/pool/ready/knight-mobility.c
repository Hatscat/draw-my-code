int f(int x, int y) {
  int n = -1;
  for (int i = -2; i < 3; i++)
    for (int j = -2; j < 3; j++) {
      int a = x + i, b = y + j;
      if (abs(i * j) != 2) continue;
      if (min(a, b) < 0) continue;
      if (max(a, b) > 7) continue;
      n++;
    }
  return n;
}
