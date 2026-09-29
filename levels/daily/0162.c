int f(int x, int y) {
  if (y < 3) // steam
    return x < 6 && x%3 == 1 + y%2;
  if (abs(x - 6) + abs(y - 5) == 1)
    return 7; // handle
  if (x > 5 || (y == 7 && x%5 == 0))
    return 0;
  return y == 3 && x%5 ? 3 : 7;
}
