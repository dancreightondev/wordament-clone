import { describe, expect, it } from 'vitest'
import { generateGridLetters } from '~/utils/grid'
import { buildTrie, solveGrid } from '~/utils/solver'
import commonWordsText from '../../public/common_words.txt?raw'

// 3x3 grid:  C A T
//            X O G
//            S D R
const GRID = ['C', 'A', 'T', 'X', 'O', 'G', 'S', 'D', 'R']

describe('solveGrid', () => {
  it('finds words along adjacent tiles, including diagonals', () => {
    const trie = buildTrie(['cat', 'cot', 'dog', 'cad', 'tag', 'goat'])
    // cat: C-A-T. cot: C-O-T (diagonal C-O, O-T). dog: D-O-G. tag: T-A-G? T(0,2)-A(0,1)-G(1,2) adjacent.
    // cad: A(0,1)-D(2,1) not adjacent. goat: G-O-A-T all adjacent.
    expect(solveGrid(GRID, 3, trie)).toEqual(new Set(['CAT', 'COT', 'DOG', 'TAG', 'GOAT']))
  })

  it('allows tiles to be re-used, but not twice in a row', () => {
    const trie = buildTrie(['tot', 'tat', 'cac', 'caa'])
    // tot: T-O-T re-uses T. tat: T-A-T re-uses T. cac: C-A-C re-uses C. caa would need A twice in a row.
    expect(solveGrid(GRID, 3, trie)).toEqual(new Set(['TOT', 'TAT', 'CAC']))
  })

  it('finds nothing for an empty trie or absent letters', () => {
    expect(solveGrid(GRID, 3, buildTrie([]))).toEqual(new Set())
    expect(solveGrid(GRID, 3, buildTrie(['zebra']))).toEqual(new Set())
  })
})

describe('solveGrid with the real common words', () => {
  const words = new Set(commonWordsText.split('\n').filter(Boolean))
  const trie = buildTrie(words)

  it('solves generated grids quickly, finding only common words', () => {
    const start = performance.now()
    let total = 0
    for (let seed = 1n; seed <= 50n; seed++) {
      const found = solveGrid(generateGridLetters(4, seed, 5), 4, trie)
      for (const word of found) expect(words.has(word.toLowerCase())).toBe(true)
      total += found.size
    }
    expect(total).toBeGreaterThan(0)
    expect(performance.now() - start).toBeLessThan(5000)
  })
})
