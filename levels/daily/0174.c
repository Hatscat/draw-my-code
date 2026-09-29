int f(int x, int y) {
  // longest common subsequence of
  // the first y of s, first x of t
  enum { A, B, C, D };
  int s[] = {A,B,C,B,D,A,B};
  int t[] = {B,D,C,A,B,A,C};
  if (!x || !y) return 0;
  if (s[y - 1] == t[x - 1])
    return f(x - 1, y - 1) + 1;
  return max(f(x-1, y), f(x, y-1));
}
