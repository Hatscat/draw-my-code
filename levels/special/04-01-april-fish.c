int f(int x, int y) {
  // an April fish in the sea
  int b = abs(2*y - 7);
  int tail = 6 - 2*x;
  int body = 7 - abs(2*x - 9);
  int c = 6;
  if (b < max(tail, body))
    c =+ 1;
  if (x == 6 && y == 2)
    c -= 1;
  return c;
}
