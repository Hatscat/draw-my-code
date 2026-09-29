int f(int x, int y) {
  int w[] = {2,4,4,0,2,4,4,6,8};
  int n = 0, u = abs(2*x - 7);
  for (int i = 0; i < 9; i++)
    switch (w[i]) {
    case 0: break;
    default:
      if (n++ == y)
        return u < w[i];
    }
  return 0;
}
