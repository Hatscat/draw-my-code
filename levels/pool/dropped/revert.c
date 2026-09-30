int f(int x, int y) {
  // version y paints [lo[y], hi[y]]
  // with color y; lo[y] < 0 instead
  // goes back to version -lo[y]
  int lo[] = {0,0,1,2,3,-3,-2,-1};
  int hi[] = {7,7,6,5,4,0,0,0};
  if (lo[y] < 0)
    return f(x, -lo[y]);
  if (x >= lo[y] && x <= hi[y])
    return y;
  return f(x, y - 1);
}
