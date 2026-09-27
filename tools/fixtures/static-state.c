int f(int x, int y) {
  static int calls;
  return (calls++ + x) & 7;
}
