int f(int x, int y) {
  float big = 16777216; // 2^24
  float s = big + x;
  int d = (int)(s - big);
  return 7 - y < d ? 3 : 0;
}
