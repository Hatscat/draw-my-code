int f(int x, int y) {
  // rows and columns in Gray code
  int n = (y ^ y/2)*8 + (x ^ x/2);
  int m[] = {022, 041, 014};
  int v[] = {022, 040, 014};
  int c = 0;
  for (int i = 0; i < 3; i++)
    if ((n & m[i]) == v[i])
      c += 1 << i;
  return c;
}
