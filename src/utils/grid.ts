import { LETTER_DISTRIBUTION, VOWELS } from '~/types/constants'

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

  // Hash function: generates a 32-bit signed integer from the string
  const hashCode = (str: string): number => {
    let h = 0
    for (let i = 0; i < str.length; i++) {
      h = (31 * h + str.charCodeAt(i)) | 0 // "| 0" forces 32‑bit overflow
    }
    return h
  }

  // Compute the hash of the seed string
  const intHash = hashCode(seedString)

  // If the hash is negative, fill the upper 32 bits with 1s to preserve sign
  // Otherwise, just convert to BigInt
  const signedBigInt = intHash >= 0 ? BigInt(intHash) : BigInt(intHash) | (BigInt(1) << 32n)
  return signedBigInt
}

/**
 * Generates an array of uppercase letters to fill a grid of the specified size,
 * using a deterministic algorithm based on the provided seed and letter frequency distribution.
 * Vowels are distributed by region for variety and separation.
 *
 * @param gridSize - The width/height of the square grid (number of rows/columns).
 * @param seed - A bigint value used to deterministically generate the grid letters.
 * @param vowels - Number of vowels to ensure in the grid (default is 0).
 * @returns An array of strings representing the letters for each cell in the grid.
 */
export const generateGridLetters = (
  gridSize: number,
  seed: bigint,
  vowels: number = 0,
  maxDuplicates: number = 3
): string[] => {
  const tileCount = gridSize ** 2

  // Build a weighted letter pool according to LETTER_DISTRIBUTION constant
  const pool: string[] = []
  Object.entries(LETTER_DISTRIBUTION).forEach(([letter, percent]) => {
    // Multiply by 10 for more granularity, then round.
    // Without this, a percentage of 0.26 would round to 0 and that letter would never appear.
    const count = Math.round(percent * 10)
    for (let i = 0; i < count; i++) {
      pool.push(letter)
    }
  })

  // Pseudo-random number generator using the seed
  const rand = (() => {
    let s = seed
    return (max: number) => {
      s = (s * 48271n) % 2147483647n // Linear congruential generator (LCG)
      return Number(s % BigInt(max))
    }
  })()

  // Divide grid into regions and place vowels randomly within each region
  const regionSize = Math.floor(tileCount / vowels)
  const vowelIndices: number[] = []
  for (let v = 0; v < vowels; v++) {
    const start = v * regionSize
    const end = v === vowels - 1 ? tileCount : (v + 1) * regionSize
    const idx = start + rand(end - start)
    vowelIndices.push(idx)
  }

  // Track letter counts
  const letterCounts: Record<string, number> = {}

  // Fill grid with distributed letters
  const letters: string[] = Array(tileCount).fill('')
  // Place vowels at calculated indices
  vowelIndices.forEach((vi) => {
    let v = VOWELS[rand(VOWELS.length)]
    // Ensure vowel does not exceed maxDuplicates
    let attempts = 0
    while (
      letterCounts[v] !== undefined &&
      letterCounts[v] >= maxDuplicates &&
      attempts < VOWELS.length
    ) {
      v = VOWELS[rand(VOWELS.length)]
      attempts++
    }
    letters[vi] = v
    letterCounts[v] = (letterCounts[v] || 0) + 1
  })

  // Fill remaining slots
  for (let i = 0; i < tileCount; i++) {
    if (letters[i]) continue // already filled with vowel
    let attempts = 0
    let letter = pool[rand(pool.length)]
    // Prevent exceeding maxDuplicates for any letter
    while ((letterCounts[letter] || 0) >= maxDuplicates && attempts < pool.length) {
      letter = pool[rand(pool.length)]
      attempts++
    }
    // Prevent more vowels (if you want to keep this restriction)
    while (VOWELS.includes(letter)) {
      letter = pool[rand(pool.length)]
      attempts++
      if (attempts >= pool.length) break
    }
    letters[i] = letter
    letterCounts[letter] = (letterCounts[letter] || 0) + 1
  }

  // Shuffle non-vowel slots deterministically, keeping vowels fixed
  for (let i = tileCount - 1; i > 0; i--) {
    if (vowelIndices.includes(i)) continue
    let j = rand(i + 1)
    while (vowelIndices.includes(j)) {
      j = rand(i + 1)
    }
    const temp = letters[i]
    letters[i] = letters[j]
    letters[j] = temp
  }

  return letters
}
