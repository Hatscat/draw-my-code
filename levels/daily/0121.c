int f(int x, int y) {
  // ASCII codes 64 to 127
  int c = 64 + 8*y + x, k = c % 32;
  if (k == 0 || k > 26)
    return 0;
  int vowels = 0x208222;
  return vowels >> k & 1 ? 4 : 1;
}
