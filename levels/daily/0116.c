int f(int x, int y) {
  // 8-slot ring buffer: op > 0 adds
  // op items, op < 0 removes -op
  int op[] = {3,2,-2,4,-3,3,-4,2};
  int in = 0, out = 0;
  for (int i = 0; i <= y; i++)
    if (op[i] > 0) in += op[i];
    else out -= op[i];
  for (int k = x; k < in; k += 8)
    if (k >= out) return k % 7 + 1;
  return 0;
}
