int f(int x, int y) {
  int item[] = {5,4,3,3,2,6,2,4,5};
  int h[8] = {0};
  for (int i = 0; i < 9; i++) {
    int b = 0;
    while (h[b] + item[i] > 8) b++;
    h[b] += item[i];
    if (b == x && h[b] + y > 7)
      return item[i];
  }
  return 0;
}
