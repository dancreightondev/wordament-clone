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

/** Modulus of the Lehmer (Park-Miller) generator used by `lcrng`. */
export const LCRNG_MODULUS = 2147483647n

/**
 * Maps any `bigint` (including negatives and zero) into the valid seed range `1..LCRNG_MODULUS - 1`.
 * A seed of zero (or a multiple of the modulus) would make the generator return zero forever,
 * and a negative seed would make it return negative values.
 */
export const normaliseSeed = (seed: bigint): bigint => {
  const remainder = ((seed % LCRNG_MODULUS) + LCRNG_MODULUS) % LCRNG_MODULUS
  return remainder === 0n ? 1n : remainder
}

/**
 * Creates a linear congruential random number generator function.
 *
 * @param seed - The initial seed value as a `bigint`. It is normalised into the valid range.
 * @returns A function that, when called with a maximum value, returns a pseudo-random integer in the range [0, max].
 *
 * @example
 * const rand = lcrng(12345n);
 * const randomNumber = rand(10); // Returns a number between 0 and 9
 */
export const lcrng = (seed: bigint) => {
  let s = normaliseSeed(seed)
  return (max: number) => {
    s = (s * 48271n) % LCRNG_MODULUS
    return Number(s % BigInt(max))
  }
}
