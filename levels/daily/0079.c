int f(int x, int y) {
  // a ball bounces off the walls
  for (int t = 0; t < 14; t++) {
    int s = (t + 3) % 14;
    int a = 7 - abs(7 - t);
    int b = 7 - abs(7 - s);
    if (x == a && y == b)
      return t / 2 + 1;
  }
  return 0;
}
