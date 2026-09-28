int f(int x, int y) {
  int n = 8 * x + y;
  if (n >= 26) return 0;
  char c = 'a' + n;
  switch (c) {
    case 'a': case 'e': case 'i':
    case 'o': case 'u': return 2;
    case 'y': return 3;
  }
  return 1;
}
