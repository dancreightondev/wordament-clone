import { describe, expect, it } from 'vitest'
import { generateDailyPuzzle, getDailyDateString } from '~/utils/daily'
import { buildTrie } from '~/utils/solver'
import commonWordsText from '../../public/common_words.txt?raw'

const trie = buildTrie(commonWordsText.split('\n').filter(Boolean))

describe('getDailyDateString', () => {
  it('formats the date as YYYY-MM-DD', () => {
    expect(getDailyDateString(new Date('2026-03-05T12:00:00Z'))).toBe('2026-03-05')
  })

  it('uses UK time, including across the British Summer Time boundary', () => {
    // 23:30 UTC in summer is 00:30 the next day in the UK
    expect(getDailyDateString(new Date('2026-07-01T23:30:00Z'))).toBe('2026-07-02')
    // In winter UK time matches UTC
    expect(getDailyDateString(new Date('2026-01-01T23:30:00Z'))).toBe('2026-01-01')
  })
})

describe('generateDailyPuzzle', () => {
  it('gives the same puzzle for the same date', () => {
    const a = generateDailyPuzzle('2026-09-29', trie, 4, 5)
    const b = generateDailyPuzzle('2026-09-29', trie, 4, 5)
    expect(a.letters).toEqual(b.letters)
    expect(a.seedString).toBe(b.seedString)
  })

  it('gives different puzzles on different dates', () => {
    const grids = new Set(
      ['2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02'].map((d) =>
        generateDailyPuzzle(d, trie, 4, 5).letters.join('')
      )
    )
    expect(grids.size).toBeGreaterThan(1)
  })

  it('only returns grids with enough common words, rejecting poorer ones', () => {
    for (let day = 1; day <= 60; day++) {
      const puzzle = generateDailyPuzzle(`2026-11-${String(day).padStart(2, '0')}`, trie, 4, 5, 80)
      expect(puzzle.solution.size).toBeGreaterThanOrEqual(80)
    }
  })

  it('falls back to the best grid found if none meets the minimum', () => {
    const puzzle = generateDailyPuzzle('2026-09-29', trie, 4, 5, 100000, 5)
    expect(puzzle.solution.size).toBeGreaterThan(0)
  })
})
