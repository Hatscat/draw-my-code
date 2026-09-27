int f(int x, int y) {
  extern int rand(void);
  return rand() & 7;
}
