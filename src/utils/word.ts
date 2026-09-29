import { LETTER_VALUES } from '~/types/constants'

const wordSet: Set<string> = new Set()
const rudeWordSet: Set<string> = new Set()

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
      loadWordsToSet('/rude_words.txt', rudeWordSet)
    ])
      .then(() => wordSet)
      .catch((error) => {
        dictionaryPromise = null // allow a retry
        throw error
      })
  }
  return dictionaryPromise
}

export type WordValidity = { isValid: true } | { isValid: false; msg: string }

export const checkWordValidity = (word: string, minLength: number = 3): WordValidity => {
  // Check word is non-empty
  if (!word) return { isValid: false, msg: 'Cannot submit an empty word' }
  // Check word is minimum length, default 3
  if (word.length < minLength) {
    return { isValid: false, msg: `${word} is too short to be a valid word` }
  }
  // Check word is NOT in rude words list
  if (rudeWordSet.has(word.toLowerCase())) {
    return { isValid: false, msg: `${word} is considered profane or inappropriate` }
  }
  // Check word is in the dictionary
  if (!wordSet.has(word.toLowerCase())) {
    return { isValid: false, msg: `${word} is not a valid word` }
  }
  return { isValid: true }
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
