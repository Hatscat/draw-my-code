int f(int x, int y) {
  // Nim: take from the first heap
  // so that all heaps XOR to 0
  int h[] = {3,2,6,7,4,4,6,3};
  int s = 0, k = 0;
  for (int i = 0; i < 8; i++)
    s ^= h[i];
  while ((h[k] ^ s) >= h[k]) k++;
  int keep = h[k] ^ s;
  if (x >= h[y]) return 0;
  return x < keep || y != k ? 1 : 2;
}
