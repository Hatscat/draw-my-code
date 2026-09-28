int f(int x, int y) {
  // 64 bits, one per cell
  long long p = 0x3C7EE7DBFFDB7E3C;
  return p >> (8*y + x) & 1 ? 4 : 0;
}
