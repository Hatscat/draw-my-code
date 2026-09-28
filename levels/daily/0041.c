int f(int x, int y) {
  // 4 grains topple, 1 to each side
  int s[100] = {[44] = 16};
  for (int k = 0; k < 64; k++)
    for (int p = 11; p < 89; p++)
      if (s[p] > 3 && p % 10 % 9) {
        s[p] -= 4;
        s[p-1]++, s[p+1]++;
        s[p-10]++, s[p+10]++;
      }
  return s[10*y + x + 11];
}
