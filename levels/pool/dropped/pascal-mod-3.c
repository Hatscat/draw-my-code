int f(int x, int y) {
  if (x == 0 || y == 0)
    return 1;
  return (f(x-1,y) + f(x,y-1)) % 3;
}
