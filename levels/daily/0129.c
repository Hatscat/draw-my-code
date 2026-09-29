int f(int x, int y) {
  // Fenwick tree: node r sums the
  // values from r & (r + 1) to r;
  // row y: the nodes summing 0..y
  if (x > y) return 0;
  int r = y;
  while ((r & (r + 1)) > x)
    r = (r & (r + 1)) - 1;
  return r;
}
