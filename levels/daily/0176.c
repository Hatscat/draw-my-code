int f(int x, int y) {
  int l<::> = <%4,3,2,2,4,3,2,1%>;
  int r<::> = <%6,5,4,6,5,4,3,2%>;
  int a = l<:y:>, b = r<:y:>;
  return x >= a && x <= b ? 4 : 0;
}
