int f(int x, int y) {
  // bit j of e[i]: a road i to j
  int e[] = {0x02, 0x04, 0x09, 0x10,
    0x28, 0x40, 0x80, 0x20};
  for (int k = 0; k < 8; k++)
    for (int i = 0; i < 8; i++)
      if (e[i] >> k & 1)
        e[i] |= e[k];
  int go = e[y] >> x & 1;
  int back = e[x] >> y & 1;
  return go && back ? 5 : go;
}
