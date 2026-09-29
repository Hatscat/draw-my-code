int f(int x, int y) {
  // A0 1RB  A1 1RH  B0 0RC
  // B1 1RB  C0 1LC  C1 1LA
  int next[] = {1,3, 2,1, 2,0};
  int t[8] = {0}, h = 2, s = 0;
  for (int k = 0; k < 2*y; k++) {
    int i = 2*s + t[h];
    t[h] = i != 2;
    h += s<2 ? 1 : -1, s = next[i];
  }
  return x == h ? s + 2 : t[x];
}
