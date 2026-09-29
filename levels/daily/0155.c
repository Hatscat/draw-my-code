int f(int x, int y) {
  // keep each meeting (row) that
  // starts once the last kept ends
  int s[] = {1,0,3,2,5,4,7,6};
  int e[] = {3,4,5,6,7,7,8,8};
  int end = 0;
  for (int m = 0; m < y; m++)
    if (s[m] >= end) end = e[m];
  if (x < s[y] || x >= e[y])
    return 0;
  return s[y] >= end ? 5 : 2;
}
