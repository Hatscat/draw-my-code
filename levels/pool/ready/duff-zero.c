int f(int x, int y) {
  int n = 0, k = (x + 3) / 4;
  switch (x % 4) {
  case 0: do { n++; // fall through
  case 3: n++; // fall through
  case 2: n++; // fall through
  case 1: n++;
    } while (--k > 0);
  }
  return 7 - y < n ? n : 0;
}
