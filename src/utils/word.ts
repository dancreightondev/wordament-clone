import { LETTER_VALUES } from '~/types/constants'

const wordSet: Set<string> = new Set()

export const loadWordsFromFile = async (filePath: string): Promise<void> => {
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
      wordSet.add(w)
      wordsInFile = wordsInFile + 1
    }
  })
  console.info(`Loaded ${wordsInFile} words from ${filePath}`)
}

export const loadDictionary = async (): Promise<Set<string>> => {
  await loadWordsFromFile('/src/assets/dictionary.txt')
  await loadWordsFromFile('/src/assets/custom_words.txt')
  console.info(`Total words in dictionary: ${wordSet.size}`)
  return wordSet
}

export const checkWordValidity = (word: string, minLength: number = 3): boolean => {
  // Check word is non-empty
  if (!word) {
    console.log('Cannot submit an empty word')
    return false
  }
  // Check word is minimum length, default 3
  if (word.length < minLength) {
    console.log(`${word} is too short to be a valid word`)
    return false
  }
  // Check word is in the dictionary
  const isValid = wordSet.has(word.toLowerCase())
  console.log(`${word} is ${isValid ? '' : 'not '}a valid word`)
  return isValid
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
