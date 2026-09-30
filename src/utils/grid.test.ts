import { describe, expect, it } from 'vitest'
import { VOWELS } from '~/types/constants'
import { generateGridLetters } from '~/utils/grid'
import { stringToSeed } from '~/utils/seed'

describe('generateGridLetters', () => {
  it.each([4, 5, 6])('fills a %i x %i grid with uppercase letters', (size) => {
    const letters = generateGridLetters(size, 12345n, size * 2 - 3)
    expect(letters).toHaveLength(size ** 2)
    expect(letters.every((l) => /^[A-Z]$/.test(l))).toBe(true)
  })

  it('is deterministic for a given seed', () => {
    expect(generateGridLetters(4, 987n, 5)).toEqual(generateGridLetters(4, 987n, 5))
  })

  it('contains the requested number of vowels', () => {
    for (let n = 1; n <= 200; n++) {
      const letters = generateGridLetters(4, stringToSeed(String(n)), 5)
      expect(letters.filter((l) => VOWELS.includes(l))).toHaveLength(5)
    }
  })

  it('produces valid grids for negative, zero and string seeds', () => {
    for (const seed of ['0', '-7', 'default', 'hello world']) {
      const letters = generateGridLetters(4, stringToSeed(seed), 5)
      expect(letters.every((l) => /^[A-Z]$/.test(l))).toBe(true)
    }
  })
})
