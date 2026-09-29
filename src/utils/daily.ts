import { generateGridLetters } from '~/utils/grid'
import { stringToSeed } from '~/utils/seed'
import { solveGrid, Trie } from '~/utils/solver'

export interface Puzzle {
  /** The seed string that produced the grid (the date, plus a suffix if earlier grids were rejected). */
  seedString: string
  /** The grid letters in row-major order. */
  letters: string[]
  /** Every common word that can be found on the grid, in upper case. */
  solution: Set<string>
}

/**
 * Returns today's date as `YYYY-MM-DD` in UK time, so that the daily puzzle changes at UK midnight
 * for everybody regardless of their own time zone.
 */
export const getDailyDateString = (now: Date = new Date()): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now)

/**
 * Generates the puzzle for a given date. The same date always gives the same puzzle.
 *
 * Grids with fewer than `minCommonWords` findable common words are rejected and the next seed
 * (`<date>#1`, `<date>#2`, ...) is tried, so that every day is playable. If no grid is good
 * enough within `maxAttempts`, the best one found is used.
 *
 * @param dateString - The date, as returned by `getDailyDateString`.
 * @param commonTrie - A trie of the common words, from `buildTrie`.
 */
export const generateDailyPuzzle = (
  dateString: string,
  commonTrie: Trie,
  gridSize: number,
  vowelCount: number,
  minCommonWords: number = 50,
  maxAttempts: number = 100
): Puzzle => {
  let best: Puzzle | null = null
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const seedString = attempt === 0 ? dateString : `${dateString}#${attempt}`
    const letters = generateGridLetters(gridSize, stringToSeed(seedString), vowelCount)
    const solution = solveGrid(letters, gridSize, commonTrie)
    if (solution.size >= minCommonWords) return { seedString, letters, solution }
    if (!best || solution.size > best.solution.size) best = { seedString, letters, solution }
  }
  return best as Puzzle
}
