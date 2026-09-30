import { LETTER_VALUES } from '~/types/constants'
import { buildTrie, Trie } from '~/utils/solver'

const wordSet: Set<string> = new Set()
const rudeWordSet: Set<string> = new Set()
const commonWordSet: Set<string> = new Set()

/**
 * Fetches a newline-separated word list and adds its (lowercased) words to `targetSet`.
 * Throws if the file cannot be loaded and `required` is true, otherwise logs a warning.
 */
export const loadWordsToSet = async (
  filePath: string,
  targetSet: Set<string>,
  required: boolean = false
): Promise<void> => {
  let response: Response
  try {
    response = await fetch(filePath)
  } catch (error) {
    if (required) throw error
    console.warn(`Failed to load words from: ${filePath}`, error)
    return
  }
  if (!response.ok) {
    const message = `Failed to load words from: ${filePath} (HTTP ${response.status})`
    if (required) throw new Error(message)
    console.warn(message)
    return
  }
  const text = await response.text()
  text.split('\n').forEach((word) => {
    const w = word.trim().toLowerCase()
    if (w) targetSet.add(w)
  })
}

let dictionaryPromise: Promise<Set<string>> | null = null

/**
 * Loads the dictionary and rude word list. Safe to call repeatedly: the files are only fetched once,
 * unless loading failed, in which case calling again retries.
 */
export const loadDictionary = (): Promise<Set<string>> => {
  if (!dictionaryPromise) {
    dictionaryPromise = Promise.all([
      loadWordsToSet('/dictionary.txt', wordSet, true),
      loadWordsToSet('/custom_words.txt', wordSet),
      loadWordsToSet('/rude_words.txt', rudeWordSet),
      loadWordsToSet('/common_words.txt', commonWordSet, true)
    ])
      .then(() => wordSet)
      .catch((error) => {
        dictionaryPromise = null // allow a retry
        throw error
      })
  }
  return dictionaryPromise
}

/**
 * The words that count towards puzzle objectives (a subset of the dictionary).
 * Other dictionary words are still accepted, but are not counted. Only available once
 * `loadDictionary` has resolved.
 */
export const getCommonWords = (): ReadonlySet<string> => commonWordSet

let commonTrie: Trie | null = null

/** A trie of the common words, built on first use. Only available once `loadDictionary` has resolved. */
export const getCommonTrie = (): Trie => (commonTrie ??= buildTrie(commonWordSet))

export const isCommonWord = (word: string): boolean => commonWordSet.has(word.toLowerCase())

/**
 * How a message should look, without saying how: `error` for a rejected word, `warning` for an
 * accepted word that comes with a caveat. The UI maps tones to colours from the current theme.
 */
export type MessageTone = 'error' | 'warning' | 'info' | 'none'

export type SubmissionResult =
  | { accepted: false; msg: string; tone: MessageTone }
  | { accepted: true; counted: true }
  | { accepted: true; counted: false; msg: string; tone: MessageTone }

/**
 * Decides what happens when a word is submitted. Rejected words (invalid or already found) are not
 * accepted. Accepted words are added to the found words, but only common ones are counted towards
 * the score and objective; the others come with a message saying so.
 *
 * @param foundWords - The words already accepted, in the same case as `word`.
 */
export const checkSubmission = (
  word: string,
  foundWords: readonly string[],
  minLength: number = 3
): SubmissionResult => {
  // Check word is non-empty
  if (!word) return { accepted: false, msg: 'Cannot submit an empty word', tone: 'error' }
  // Check word is minimum length, default 3
  if (word.length < minLength) {
    return { accepted: false, msg: `Too short`, tone: 'error' }
  }
  // Check word is NOT in rude words list
  if (rudeWordSet.has(word.toLowerCase())) {
    return { accepted: false, msg: `Profane or inappropriate`, tone: 'warning' }
  }
  // Check word is in the dictionary
  if (!wordSet.has(word.toLowerCase())) {
    return { accepted: false, msg: `Not a word`, tone: 'error' }
  }
  // Check word has not already been found
  if (foundWords.includes(word)) return { accepted: false, msg: 'Already scored', tone: 'warning' }
  // Valid words are accepted, but only common ones count
  if (!isCommonWord(word))
    return { accepted: true, counted: false, msg: 'Uncommon word', tone: 'info' }
  return { accepted: true, counted: true }
}

export const calculateWordScore = (word: string): number => {
  if (!word) return 0
  let wordScore = 0
  for (const letter of word.toUpperCase()) {
    if (Object.prototype.hasOwnProperty.call(LETTER_VALUES, letter)) {
      wordScore += LETTER_VALUES[letter]
    }
  }
  return wordScore
}
