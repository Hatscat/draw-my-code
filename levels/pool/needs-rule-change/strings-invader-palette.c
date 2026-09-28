int f(int x, int y) {
  char *half[] = {
    "...P", "..PP", ".PPP", "PPWP",
    "PPPP", "..O.", ".O.O", "O.O.",
  };
  char c = half[y][min(x, 7 - x)];
  int i = 0;
  while (".WROYGBP"[i] != c) i++;
  return i;
}
