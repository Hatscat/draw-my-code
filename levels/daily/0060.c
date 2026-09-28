int f(int x, int y) {
  // 2048, swipe left: tile 2^k is k
  int b[] = {
    01111, 02023, 04333, 01234};
  int t[4] = {0}, n = 0, m = -1;
  for (int i = 9; i >= 0; i -= 3) {
    int k = b[y/2] >> i & 7;
    if (k == m) t[n-1]++, m = -1;
    else if (k) t[n++] = m = k;
  }
  return t[x/2];
}
