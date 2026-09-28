int f(int x, int y) {
  int img[] = {
    22000, 222200, 2222220,
    22222222, 1111110, 1611610,
    1113110, 55553555};
  int v = img[y];
  for (int i = x; i < 7; i++)
    v /= 10;
  return v % 10;
}
