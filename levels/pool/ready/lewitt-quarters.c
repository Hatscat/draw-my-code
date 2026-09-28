int f(int x, int y) {
  // Sol LeWitt: a wall in 4 parts,
  // a kind of line in each part
  int part = x / 4 + y / 4 * 2;
  int on[] = {
    x % 2 == 0, y % 2 == 0,
    (x+y) % 3 == 0, (x-y) % 3 == 0
  };
  int ink[] = {4, 2, 6, 1};
  return on[part] ? ink[part] : 0;
}
