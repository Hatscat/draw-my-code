int f(int x, int y) {
  int v = 4700, n = 0; // 4.7k ohms
  while (v > 99)
    v /= 10, n++;
  int c[] = {1, v / 10, 6, v % 10,
    6, n, 6, 1};
  if (y < 2 || y > 5)
    return 0;
  if (x % 7 == 0 && y % 3 == 2)
    return 0;
  return c[x];
}
