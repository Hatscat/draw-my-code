int f(int x, int y) {
  // Towers of Hanoi, move number n:
  // which disk moves?
  int n = 8*y + x + 1;
  int disk = 1;
  while (n % 2 == 0) {
    n /= 2;
    disk++;
  }
  return disk;
}
