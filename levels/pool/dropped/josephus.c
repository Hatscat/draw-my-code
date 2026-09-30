int f(int x, int y) {
  // n people in a circle, every 2nd
  // one leaves: f(n, 8) is the seat
  // of the last one, counted from 1
  if (y > 7)
    return x < 2 ? 1
      : 2*f(x/2, 8) + 2*(x%2) - 1;
  if (x > y)
    return 0;
  return f(y+1, 8) == x + 1 ? 2 : 1;
}
