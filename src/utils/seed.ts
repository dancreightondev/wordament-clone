import { hashCode, normaliseSeed } from '~/utils/number'

/**
 * Converts a string to a `bigint` value.
 *
 * - If the seed is a valid integer string (including negative numbers), it is directly converted to `bigint`.
 * - Otherwise, the seed is hashed using a 32-bit signed integer hash function, and the result is converted to `bigint`.
 * - Either way, the result is normalised into the valid range for `lcrng` (positive and non-zero).
 *
 * @param seedString - The string to convert to a `bigint` seed value.
 * @returns The corresponding `bigint` value derived from the seed.
 */
export const stringToSeed = (seedString: string): bigint => {
  // Check if the seed is a valid integer string (including negative numbers)
  const numericMatch = /^-?\d+$/.exec(seedString.trim())
  if (numericMatch) {
    // If so, convert directly to BigInt
    return normaliseSeed(BigInt(numericMatch[0]))
  }

  return normaliseSeed(BigInt(hashCode(seedString)))
}

/**
 * Generates a random seed string of up to eight digits.
 *
 * Uses the Web Crypto API, which (unlike `crypto.subtle`) is available in insecure contexts,
 * so it also works when the dev server is reached over HTTP on a local network.
 */
export const generateSeedString = (): string => {
  const [random] = crypto.getRandomValues(new Uint32Array(1))
  return (random % 100000000).toString()
}

/** The query string parameter that holds the seed of a shared zen mode puzzle. */
export const SEED_PARAM = 'seed'

const MAX_SEED_LENGTH = 64

/**
 * Reads the seed from a URL query string (for example `?seed=12345`), so that a link can open a
 * specific zen mode puzzle. Returns `null` if there is no usable seed.
 */
export const getSeedFromSearch = (search: string): string | null => {
  const seed = new URLSearchParams(search).get(SEED_PARAM)?.trim()
  return seed && seed.length <= MAX_SEED_LENGTH ? seed : null
}
