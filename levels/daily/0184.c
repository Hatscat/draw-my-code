int f(int x, int y) {
  int i = 3, j = 3;
  for (int k = 1; k < 9; k++)
    for (int s = 0; s < 2*k; s++) {
      if (i == x && j == y)
        return k - 1;
      int d = k % 2 ? 1 : -1;
      if (s < k) i += d;
      else j += d;
    }
  return 0;
}
