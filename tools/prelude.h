/* Force-included (gcc -include) into tools/harness.c and every level.
   These three helpers are the only functions a level may call. */

/* Shared prototype, so the harness and the level agree on the signature. */
int f(int x, int y);

/* static inline: no external symbol, no "defined but not used" warning, and
   each argument is evaluated once. UBSan reports abs(INT_MIN). */
static inline int abs(int a) { return a < 0 ? -a : a; }
static inline int min(int a, int b) { return a < b ? a : b; }
static inline int max(int a, int b) { return a > b ? a : b; }
