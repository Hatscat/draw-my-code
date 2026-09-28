int f(int x, int y) {
  int m[] = {-1,0,5, 0,1,3, 1,0,5,
    0,1,3, -1,0,5};
  int px = 6, py = 1;
  for (int i = 0; i < 15; i += 3)
    for (int k = m[i+2]; k; k--) {
      if (px == x && py == y)
        return i / 3 + 1;
      px += m[i], py += m[i+1];
    }
  return px == x && py == y ? 7 : 0;
}
