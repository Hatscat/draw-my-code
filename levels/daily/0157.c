int f(int x, int y) {
  // LZ77 tokens: off, len, literal
  int z[] = {0,0,6, 1,2,3, 4,3,3,
    8,16,3, 1,6,3, 32,31,3};
  int out[64], n = 0;
  for (int t = 0; n < 64; t += 3) {
    for (int k = 0; k < z[t+1]; k++)
      out[n] = out[n - z[t]], n++;
    out[n++] = z[t+2];
  }
  return out[8*y + x];
}
