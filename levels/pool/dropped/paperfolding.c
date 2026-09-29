int f(int x, int y) {
  // fold a strip in half 7 times,
  // unfold it, read crease n
  int n = 8*y + x + 1;
  while (n % 2 == 0)
    n /= 2;
  return n % 4 == 1 ? 6 : 2;
}
