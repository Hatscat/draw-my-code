int f(int x, int y) {
  int n = 8*y + x + 1;
  if (n % 3 == 0)
    return 4; // Fizz
  if (n % 5 == 0)
    return 6; // Buzz
  if (n % 15 == 0)
    return 5; // FizzBuzz
  return 0;
}
