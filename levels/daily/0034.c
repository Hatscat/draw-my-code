int f(int x, int y) {
  int px[] = {2, 6, 3, 0};
  int py[] = {1, 3, 6, 5};
  int best = 99, c = 0;
  for (int i = 0; i < 4; i++) {
    int dx = x-px[i], dy = y-py[i];
    int d = dx*dx + dy*dy;
    if (d == best) c = 1;
    if (d < best) best = d, c = i+2;
  }
  return best ? c : 0;
}
