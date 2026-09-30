int f(int x, int y) {
  // A C G T are 0 1 2 3; each base
  // pairs with its complement
  int s[8] = {2, 0, 3, 3, 0, 1, 0};
  int w = 1 + 3*abs(y%4 - 2);
  if (abs(2*x - 7) > w)
    return 0;
  unsigned b = s[y];
  if (x > 3)
    b = ~b & 3;
  return 5 - b;
}
