int f(int x, int y) {
  // k-d tree: node n = y / 8 puts a
  // wall at x == c[n]; its children
  // 2n + 1, 2n + 2 swap the axes
  int c[] = {3, 4, 2, 8, 8, 5, 6};
  int room[] = {6,0,0,0,0,4,5,2};
  int n = y / 8;
  if (n > 6) return room[n - 7];
  if (x == c[n]) return 1;
  int k = 2*n + 1 + (x > c[n]);
  return f(y % 8, x + 8*k);
}
