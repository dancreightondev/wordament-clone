import { isAdjacent } from '~/utils/grid'

interface TrieNode {
  children: Map<string, TrieNode>
  isWord: boolean
}

export type Trie = TrieNode

const createNode = (): TrieNode => ({ children: new Map(), isWord: false })

/** Builds a prefix tree from a collection of words, stored in upper case to match grid letters. */
export const buildTrie = (words: Iterable<string>): Trie => {
  const root = createNode()
  for (const word of words) {
    let node = root
    for (const letter of word.toUpperCase()) {
      let next = node.children.get(letter)
      if (!next) {
        next = createNode()
        node.children.set(letter, next)
      }
      node = next
    }
    node.isWord = true
  }
  return root
}

/** Precomputes, for each tile, the indices of the tiles adjacent to it. */
const buildNeighbours = (gridSize: number): number[][] =>
  Array.from({ length: gridSize ** 2 }, (_, i) =>
    Array.from({ length: gridSize ** 2 }, (_, j) => j).filter((j) => isAdjacent(i, j, gridSize))
  )

/**
 * Finds every word in the trie that can be spelled on the grid, following the game's rules:
 * each tile must be adjacent to the previous one (including diagonals), and tiles may be re-used.
 *
 * The search only follows paths that are prefixes of words in the trie, so it stays fast even
 * though re-use makes the number of possible paths unbounded.
 *
 * @param letters - The grid letters in row-major order (upper case).
 * @param gridSize - The width of the (square) grid.
 * @param trie - The words to search for, from `buildTrie`.
 * @returns The words found, in upper case.
 */
export const solveGrid = (letters: string[], gridSize: number, trie: Trie): Set<string> => {
  const neighbours = buildNeighbours(gridSize)
  const found = new Set<string>()

  const search = (tile: number, node: TrieNode, prefix: string) => {
    const next = node.children.get(letters[tile])
    if (!next) return
    const word = prefix + letters[tile]
    if (next.isWord) found.add(word)
    for (const neighbour of neighbours[tile]) search(neighbour, next, word)
  }

  for (let tile = 0; tile < letters.length; tile++) search(tile, trie, '')
  return found
}
