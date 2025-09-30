import { hashCode } from '~/utils/number'

/**
 * Converts a string to a `bigint` value.
 *
 * - If the seed is a valid integer string (including negative numbers), it is directly converted to `bigint`.
 * - Otherwise, the seed is hashed using a 32-bit signed integer hash function, and the result is converted to `bigint`.
 * - For negative hash values, the upper 32 bits are filled with 1s to preserve the sign.
 *
 * @param seedString - The string to convert to a `bigint` seed value.
 * @returns The corresponding `bigint` value derived from the seed.
 */
export const stringToSeed = (seedString: string): bigint => {
  // Check if the seed is a valid integer string (including negative numbers)
  const numericMatch = /^-?\d+$/.exec(seedString.trim())
  if (numericMatch) {
    // If so, convert directly to BigInt
    return BigInt(numericMatch[0])
  }

  const intHash = hashCode(seedString)
  return intHash >= 0 ? BigInt(intHash) : BigInt(intHash) | (BigInt(1) << 32n)
}
