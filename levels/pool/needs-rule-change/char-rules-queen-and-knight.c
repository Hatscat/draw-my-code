int f(int x, int y) {
  // queen on d1, knight on f5
  char c = 'a' + x, r = '8' - y;
  int qx = c - 'd', qy = r - '1';
  int nx = c - 'f', ny = r - '5';
  if (!qx && !qy) return 1;
  if (!nx && !ny) return 7;
  int q = !qx || !qy;
  q = q || abs(qx) == abs(qy);
  int n = nx*nx + ny*ny == 5;
  return q * 4 + n * 2;
}
