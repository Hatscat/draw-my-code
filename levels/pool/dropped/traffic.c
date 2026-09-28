int f(int x, int y) {
  // a car moves right if the
  // cell ahead is free
  int car = 0x6F, jam = car, go = 0;
  for (int t = 0; t < y; t++) {
    jam = car & car >> 1;
    go = car << 1 & ~car & 0xFF;
    car = jam | go;
  }
  if (jam >> x & 1) return 2;
  return go >> x & 1 ? 5 : 0;
}
