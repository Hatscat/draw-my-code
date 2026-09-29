int f(int x, int y) {
  // rock 2, scissors 4, paper 6
  int hand[] = {2,4,6,6,4,2,4,6};
  if (y < 2)
    return hand[x];
  int s = y < 4 ? 2 : y < 6 ? 4 : 8;
  int a = f(x/s*s, y - 2);
  int b = f(x/s*s + s/2, y - 2);
  return b == a % 6 + 2 ? a : b;
}
