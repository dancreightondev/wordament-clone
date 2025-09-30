import { LETTER_DISTRIBUTION, VOWELS } from '~/types/constants'
import { lcrng } from '~/utils/number'

/**
 * Places vowels in the grid, respecting maxDuplicates.
 */
const placeVowels = (
  gridSize: number,
  vowels: number,
  rand: (max: number) => number,
  letterCounts: Record<string, number>,
  maxDuplicates: number
): { letters: string[]; vowelIndices: number[] } => {
  const tileCount = gridSize ** 2
  const regionSize = Math.floor(tileCount / vowels)
  const letters = Array(tileCount).fill('')
  const vowelIndices: number[] = []

  for (let v = 0; v < vowels; v++) {
    const start = v * regionSize
    const end = v === vowels - 1 ? tileCount : (v + 1) * regionSize
    let idx = start + rand(end - start)
    // Ensure unique index
    while (letters[idx] !== '') {
      idx = start + rand(end - start)
    }
    let vowel = VOWELS[rand(VOWELS.length)]
    let attempts = 0
    while ((letterCounts[vowel] || 0) >= maxDuplicates && attempts < VOWELS.length) {
      vowel = VOWELS[rand(VOWELS.length)]
      attempts++
    }
    letters[idx] = vowel
    vowelIndices.push(idx)
    letterCounts[vowel] = (letterCounts[vowel] || 0) + 1
  }
  return { letters, vowelIndices }
}

/**
 * Picks a random letter from the pool, respecting maxDuplicates and vowel exclusion.
 */
const pickLetter = (
  pool: string[],
  rand: (max: number) => number,
  letterCounts: Record<string, number>,
  maxDuplicates: number,
  excludeVowels = false
): string => {
  let attempts = 0
  let letter = pool[rand(pool.length)]
  while (
    (letterCounts[letter] || 0) >= maxDuplicates ||
    (excludeVowels && VOWELS.includes(letter))
  ) {
    letter = pool[rand(pool.length)]
    attempts++
    if (attempts > pool.length * 2) break // Prevent infinite loop
  }
  return letter
}

/**
 * Generates an array of uppercase letters for the grid.
 */
export const generateGridLetters = (
  gridSize: number,
  seed: bigint,
  vowels: number = 0,
  maxDuplicates: number = 2
): string[] => {
  const tileCount = gridSize ** 2
  const pool: string[] = []
  Object.entries(LETTER_DISTRIBUTION).forEach(([letter, percent]) => {
    const count = Math.round(percent * 10)
    for (let i = 0; i < count; i++) pool.push(letter)
  })

  const rand = lcrng(seed)
  const letterCounts: Record<string, number> = {}

  // Place vowels first
  const { letters, vowelIndices } = placeVowels(gridSize, vowels, rand, letterCounts, maxDuplicates)

  // Fill remaining slots with consonants
  for (let i = 0; i < tileCount; i++) {
    if (letters[i]) continue
    const letter = pickLetter(pool, rand, letterCounts, maxDuplicates, true)
    letters[i] = letter
    letterCounts[letter] = (letterCounts[letter] || 0) + 1
  }

  // Deterministic shuffle (vowels fixed)
  for (let i = tileCount - 1; i > 0; i--) {
    if (vowelIndices.includes(i)) continue
    let j = rand(i + 1)
    while (vowelIndices.includes(j)) {
      j = rand(i + 1)
    }
    ;[letters[i], letters[j]] = [letters[j], letters[i]]
  }

  return letters
}
