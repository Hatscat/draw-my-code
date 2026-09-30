int f(int x, int y) {
  // three skylines, nearest first
  int h[3][8] = {
    {3,3,2,2,1,1,3,3},
    {4,4,5,5,3,3,5,5},
    {6,6,7,7,6,6,7,7}};
  int ink[] = {0, 6, 7}, c = 3;
  for (unsigned i = 2; ~i; i--)
    if (7 - y < h[i][x])
      c = ink[i];
  return c;
}
