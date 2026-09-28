int f(int x, int y) {
  char name[][8] = {
    "black", "white", "red",
    "orange", "yellow", "green",
    "blue", "purple",
  };
  return name[y][x] ? y : 0;
}
