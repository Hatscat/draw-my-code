int f(int x, int y) {
  if (x == 0 && y == 0)
    return 5;
  int c = f(x / 2, y / 2);
  return (x + y) % 2 ? 5 - c : c;
}
