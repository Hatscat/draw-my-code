int f(int x, int y) {
  int u = 2*x - 7, v = 2*y - 7;
  int l = u + 3, r = u - 3;
  int t = v + 3, b = v - 2;
  int in1 = l*l + t*t < 30;
  int in2 = r*r + t*t < 30;
  int in3 = u*u + b*b < 30;
  return in1 + 2*in2 + 4*in3;
}
