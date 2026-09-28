int f(int x, int y) {
  int tx=3, ty=4, tz=5, r=6;
  int z = 7;
  for (; z > 0; z--) {
    int dx=tx-x, dy=ty-y, dz=tz-z;
    int x2=dx*dx,y2=dy*dy,z2=dz*dz;
    if (x2<r && y2<r && z2<r) {
      break;
    }
  }
  return z;
}
