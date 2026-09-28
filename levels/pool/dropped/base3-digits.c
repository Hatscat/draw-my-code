int f(int x, int y) {
  int v = x * y, d = 0;
  do {
    d++;
    v /= 3;
  } while (v > 0);
  return d;
}
