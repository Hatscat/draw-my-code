int f(int x, int y) {
  // Life; y + 10 is a step back
  int g[] = {2,4,7,0,64,32,227,3};
  if (x < 0 || x > 7 || y % 10 > 7)
    return 0;
  if (y > 39)
    return g[y % 10] >> x & 1;
  int a = f(x, y + 10), s = 0;
  for (int k = 0; k < 9; k++)
    s += f(x-1 + k%3, y+9 + k/3);
  return s == 3 || s - a == 3;
}
