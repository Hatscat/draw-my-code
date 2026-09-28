int f(int x, int y) {
  int mx[] = {1, 2, 1, 5, 6, 5, 6};
  int my[] = {1, 1, 2, 1, 5, 6, 6};
  int n = 0;
  for (int k = 0; k < 7; k++) {
    int dx = abs(x - mx[k]);
    int dy = abs(y - my[k]);
    if (dx + dy == 0) return 7;
    n += dx < 2 && dy < 2;
  }
  return n;
}
