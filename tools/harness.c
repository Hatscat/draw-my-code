/* Prints f(x, y) for the 8x8 grid: 8 lines of 8 space-separated ints, y down.
   Values are printed raw: tools/levels.ts checks the range, so errors can name
   the cell. */
#include <stdio.h>
#include <sys/prctl.h>

int main(void) {
  /* A crashing level (endless recursion) would otherwise leave a core dump,
     and a crash report on the desktop, at every test run. */
  prctl(PR_SET_DUMPABLE, 0, 0, 0, 0);
  for (int y = 0; y < 8; y++) {
    for (int x = 0; x < 8; x++) {
      printf(x < 7 ? "%d " : "%d\n", f(x, y));
    }
  }
  return 0;
}
