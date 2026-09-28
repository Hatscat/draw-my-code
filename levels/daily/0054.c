int f(int x, int y) {
  int dots[] = {
    022, 025, 051, 056,
    062, 063, 064, 065};
  for (int i = 0; i < 8; i++)
    if (8*y + x == dots[i])
      return 0;
  return 4;
}
