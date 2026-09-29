int f(int x, int y) {
  int n = 10*y + x + 1, len = 0;
  int v[] = {50,40,10,9,5,4,1};
  int w[] = { 1, 2, 1,2,1,2,1};
  for (int i = 0; i < 7; i++)
    while (n >= v[i]) {
      n -= v[i];
      len += w[i];
    }
  return len;
}
