int f(int x, int y) {
  union { int day, night; } sky;
  int a = x - 5, b = x - 4;
  int c = (y - 2) * (y - 2);
  sky.day = a*a + c < 5 ? 4 : 6;
  sky.night = (2*x + y) % 7 ? 0 : 1;
  if (a*a + c < 5 && b*b + c > 1)
    sky.night = 4;
  return y > 5 ? 5 : sky.day;
}
