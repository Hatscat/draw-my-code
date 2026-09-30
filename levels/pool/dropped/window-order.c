int f(int x, int y) {
  // windows at (p, p), front first
  int p[] = {3,1,0}, hit = 0;
  int ink[] = {6,2,4}, c = 0, i = 0;
  for (; i < 3 && ~hit; i++) {
    int dx = x-p[i], dy = y-p[i];
    hit = dx >= 0 && dy >= 0 &&
      dx < 5 && dy < 5;
    if (hit) c = dy ? ink[i] : 1;
  }
  return c;
}
