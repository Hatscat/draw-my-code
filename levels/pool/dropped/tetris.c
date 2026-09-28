int f(int x, int y) {
  int w[] = {2,4,8,6,8,2,8,2};
  int k = 7;
  for (int i = 7; i >= 0; i--)
    if (w[i] < 8) w[k--] = w[i];
  while (k >= 0) w[k--] = 0;
  if (abs(2*x-7) >= w[y]) return 0;
  return y > 5 ? 3 : 5;
}
