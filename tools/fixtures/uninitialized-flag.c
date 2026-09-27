int f(int x, int y) {
  int hit;
  for (int i = 0; i < 8; i++)
    if (i * i == x + y)
      hit = 1;
  return hit ? 4 : 1;
}
