int f(int x, int y) {
  // bar heights, before and after
  int a[8] = {3, 5, 2, 6, 4, 7, 3};
  int b[8] = {4, 3, 2, 7, 6, 5, 5};
  unsigned was = ~(~0u << a[x]);
  unsigned now = ~(~0u << b[x]);
  unsigned bit = 1u << (7 - y);
  if (now & ~was & bit) return 5;
  if (was & ~now & bit) return 2;
  return was & bit ? 1 : 0;
}
