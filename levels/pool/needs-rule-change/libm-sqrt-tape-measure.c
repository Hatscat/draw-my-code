int f(int x, int y) {
  // legs a and b, hypotenuse?
  int a = x + 1, b = y + 1;
  int n = a*a + b*b;
  int r = (int)sqrt(n);
  if (r * r == n) return 4;
  return r == 5 || r == 10 ? 6 : 0;
}
