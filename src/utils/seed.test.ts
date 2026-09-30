import { describe, expect, it } from 'vitest'
import { LCRNG_MODULUS, lcrng } from '~/utils/number'
import { generateSeedString, getSeedFromSearch, stringToSeed } from '~/utils/seed'

describe('stringToSeed', () => {
  it('keeps ordinary numeric seeds unchanged', () => {
    expect(stringToSeed('12345')).toBe(12345n)
  })

  it('always returns a seed within the valid range', () => {
    for (const s of [
      '0',
      '-5',
      'default',
      'hello',
      'a much longer seed string',
      '99999999999999'
    ]) {
      const seed = stringToSeed(s)
      expect(seed).toBeGreaterThan(0n)
      expect(seed).toBeLessThan(LCRNG_MODULUS)
    }
  })
})

describe('lcrng', () => {
  it('is deterministic', () => {
    const a = lcrng(42n)
    const b = lcrng(42n)
    expect(Array.from({ length: 10 }, () => a(100))).toEqual(
      Array.from({ length: 10 }, () => b(100))
    )
  })

  it('never returns negative or constant values, even for awkward seeds', () => {
    for (const seed of [0n, -1n, -123456789n, LCRNG_MODULUS]) {
      const rand = lcrng(seed)
      const values = Array.from({ length: 50 }, () => rand(26))
      expect(values.every((v) => v >= 0 && v < 26)).toBe(true)
      expect(new Set(values).size).toBeGreaterThan(1)
    }
  })
})

describe('generateSeedString', () => {
  it('returns a numeric string of at most eight digits', () => {
    expect(generateSeedString()).toMatch(/^\d{1,8}$/)
  })
})

describe('getSeedFromSearch', () => {
  it('reads the seed parameter', () => {
    expect(getSeedFromSearch('?seed=12345')).toBe('12345')
    expect(getSeedFromSearch('?other=1&seed=hello%20world')).toBe('hello world')
  })

  it('returns null when there is no usable seed', () => {
    expect(getSeedFromSearch('')).toBeNull()
    expect(getSeedFromSearch('?other=1')).toBeNull()
    expect(getSeedFromSearch('?seed=')).toBeNull()
    expect(getSeedFromSearch('?seed=%20%20')).toBeNull()
    expect(getSeedFromSearch(`?seed=${'x'.repeat(65)}`)).toBeNull()
  })
})
