int f(int x, int y) {
  int at[] = {011, 016, 040, 064};
  int d[] = {1, 010, 010, 1};
  int i, k, len[] = {5, 4, 3, 2};
  for (i = 0; i < 4; i++)
    for (k = 0; k < len[i]; k++)
      if (at[i] + k*d[i] == 8*y + x)
        goto hit;
  return 6;
hit:
  return len[i];
}
