int f(int x, int y) {
  // Bits set in x * y, and a twist.
  int v = x * y;
  int bits = 0;
  while (v > 0) {
    bits += v & 1;
    v /= 2;
  }
  if (bits >= 4)
    return 7;
  return bits + (x + y) % 2 * 4;
}
