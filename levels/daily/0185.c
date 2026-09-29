int f(int x, int y) {
  int h = 1;
  switch (x) {
  case 0: case 7:
    h += 2; // fall through
  default:
    h += 2; // fall through
  case 3: case 4:
    h++;
  }
  return 7 - y < h ? h + 1 : 0;
}
