int f(int x, int y) {
  int key[] = {13,5,21,7,2,10,8};
  int t[8] = {0};
  for (int i = 0; i < y; i++) {
    int p = key[i] % 8;
    while (t[p]) p = (p + 1) % 8;
    t[p] = i + 1;
  }
  return t[x];
}
