const foundWordsKey = (dateString: string) => `wordament:found:${dateString}`

/** Loads the words found on a given day. Returns an empty list if storage is unavailable or invalid. */
export const loadFoundWords = (dateString: string): string[] => {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(foundWordsKey(dateString)) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((w): w is string => typeof w === 'string') : []
  } catch {
    return []
  }
}

/** Saves the words found on a given day. Silently does nothing if storage is unavailable. */
export const saveFoundWords = (dateString: string, words: string[]): void => {
  try {
    localStorage.setItem(foundWordsKey(dateString), JSON.stringify(words))
  } catch {
    // Storage may be blocked or full; progress simply will not persist
  }
}
