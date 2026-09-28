int f(int x, int y) {
  char *row[] = {
    "22222222",
    "33333333",
    "44444444"
    "55555555",
    "66666666",
    "77777777",
  };
  int n = sizeof row / sizeof *row;
  return row[y % n][x] - '0';
}
