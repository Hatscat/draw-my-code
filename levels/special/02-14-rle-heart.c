int f(int x, int y) {
  // run-length encoded
  int run[] = {
    1,2,2,2,1,24,1,6,3,4,5,2,11
  };
  int i = 8*y + x, k = 0;
  while (i >= run[k])
    i -= run[k++];
  return k % 2 ? 2 : 0;
}
