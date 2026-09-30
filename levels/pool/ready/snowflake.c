int f(int x, int y) {
  // f(x, y + 10) is 1 step earlier,
  // y % 10 > 7 is off-board; ice
  // grows beside exactly 1 ice cell
  if (x < 0 || x > 7 || y % 10 > 7)
    return 0;
  if (y > 29)
    return x == 3 && y == 33;
  return f(x, y+10) || f(x-1, y+10)
    + f(x+1, y+10) + f(x, y+9)
    + f(x, y+11) == 1;
}
