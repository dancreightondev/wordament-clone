import { LETTER_VALUES } from '~/types/constants'

const wordSet: Set<string> = new Set()
const rudeWordSet: Set<string> = new Set()

export const loadWordsToSet = async (filePath: string, targetSet: Set<string>): Promise<void> => {
  let wordsInFile = 0 // track word count for logging purposes
  const response = await fetch(filePath)
  if (!response.ok) {
    console.warn(`File not found or failed to load words from: ${filePath}`)
    return
  }
  const text = await response.text()
  text.split('\n').forEach((word) => {
    const w = word.trim().toLowerCase()
    if (w) {
      targetSet.add(w)
      wordsInFile = wordsInFile + 1
    }
  })
  console.info(`Loaded ${wordsInFile} words from ${filePath}`)
}

export const loadDictionary = async (): Promise<Set<string>> => {
  await loadWordsToSet('/dictionary.txt', wordSet)
  await loadWordsToSet('/custom_words.txt', wordSet)
  await loadWordsToSet('/rude_words.txt', rudeWordSet)
  console.info(`Total words in dictionary: ${wordSet.size}`)
  return wordSet
}

export const checkWordValidity = (
  word: string,
  minLength: number = 3
): { isValid: boolean; msg: string } => {
  // Check word is non-empty
  if (!word) {
    console.log('Cannot submit an empty word')
    return { isValid: false, msg: 'Cannot submit an empty word' }
  }
  // Check word is minimum length, default 3
  if (word.length < minLength) {
    console.log(`${word} is too short to be a valid word`)
    return { isValid: false, msg: `${word} is too short to be a valid word` }
  }
  // Check word is NOT in rude words list
  if (rudeWordSet.has(word.toLowerCase())) {
    console.log(`${word} is considered profane or inappropriate`)
    return { isValid: false, msg: `${word} is considered profane or inappropriate` }
  }
  // Check word is in the dictionary
  const isValid = wordSet.has(word.toLowerCase())
  console.log(`${word} is ${isValid ? '' : 'not '}a valid word`)
  return { isValid, msg: isValid ? `${word} is valid` : `${word} is not a valid word` }
}

export const calculateWordScore = (word: string): number => {
  if (!word) return 0
  let wordScore = 0
  for (const letter of word.toUpperCase()) {
    if (Object.prototype.hasOwnProperty.call(LETTER_VALUES, letter)) {
      wordScore += LETTER_VALUES[letter]
    }
  }
  console.log(`${word} is worth ${wordScore} points`)
  return wordScore
}
