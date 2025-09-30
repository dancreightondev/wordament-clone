/**
 * Generates a 32-bit hash code for a string using a polynomial hashing algorithm.
 *
 * This implementation is based on the popular algorithm used in Java's `String.hashCode()`,
 * which uses the prime number 31 as a multiplier. The resulting hash is a signed
 * 32-bit integer, and overflow is handled by the bitwise OR `| 0` operation.
 *
 * @param str The input string to hash.
 * @returns The 32-bit hash code for the string.
 */
export const hashCode = (str: string): number => {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (31 * h + str.charCodeAt(i)) | 0 // "| 0" forces 32‑bit overflow
  }
  return h
}

/**
 * Creates a linear congruential random number generator function.
 *
 * @param seed - The initial seed value as a `bigint`.
 * @returns A function that, when called with a maximum value, returns a pseudo-random integer in the range [0, max).
 *
 * @example
 * const rand = lcrng(12345n);
 * const randomNumber = rand(10); // Returns a number between 0 and 9
 */
export const lcrng = (seed: bigint) => {
  let s = seed
  return (max: number) => {
    s = (s * 48271n) % 2147483647n
    return Number(s % BigInt(max))
  }
}
