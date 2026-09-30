int f(int x, int y) {
  if (y % 4 == 0)
    return 6;
  // byte k: line k, bit x: column x
  unsigned long text = 0x3E1E7F00;
  unsigned r = text >> 8*(y % 4);
  // the bottom half is light mode
  if (y > 3)
    r = ~r;
  return r >> x & 1;
}
