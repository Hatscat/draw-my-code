int f(int x, int y) {
  int top = 8*y + x, primes = 0;
  for (int n = 2; n <= top; n++) {
    int d = 2;
    while (n % d)
      d++;
    primes += d == n;
  }
  return primes % 8;
}
