int f(int x, int y) {
  // one ray per column; side walls
  // 5 away, the end wall 10 ahead
  int s = abs(2*x - 7);
  int v = abs(2*y - 7);
  // the ray drifts s/7 per step
  int z = min(35 / s, 10);
  // nearer walls look taller
  if (v*z < 30)
    return z < 10 ? 6 : 2;
  return y > 3 ? 5 : 0;
}
