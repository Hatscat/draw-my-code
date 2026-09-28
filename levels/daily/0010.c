int f(int x, int y) {
  int c = 1 << x;
  int a[] = {
    c & 0x14 ? 3:0, c & 0x1E ? 5:0,
    c & 0x35 ? 5:0, c & 0x1F ? 5:0,
    c & 0x3C ? 5:0, c & 0x9E ? 5:0,
    c & 0x7C ? 5:0, c & 0x14 ? 5:0,
  };
  return a[y];
}
