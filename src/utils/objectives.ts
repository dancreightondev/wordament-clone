import { calculateWordScore } from '~/utils/word'

export type ObjectiveType = 'score' | 'words'

export interface Objective {
  type: ObjectiveType
  target: number
}

/** Fraction of the total available (common-word) score needed to complete a score objective. */
export const SCORE_TARGET_FRACTION = 0.5
/** Fraction of the available common words needed to complete a word-count objective. */
export const WORDS_TARGET_FRACTION = 0.4

/** Total score of a set of words. */
export const totalScore = (words: Iterable<string>): number => {
  let total = 0
  for (const word of words) total += calculateWordScore(word)
  return total
}

/**
 * Derives an objective from the words that can be found on the grid.
 * The target is always at least 1 and never more than what is available.
 */
export const deriveObjective = (type: ObjectiveType, solution: ReadonlySet<string>): Objective => {
  const available = type === 'score' ? totalScore(solution) : solution.size
  const fraction = type === 'score' ? SCORE_TARGET_FRACTION : WORDS_TARGET_FRACTION
  return { type, target: Math.min(available, Math.max(1, Math.round(available * fraction))) }
}

/** The player's progress towards an objective, given the common words they have found. */
export const objectiveProgress = (objective: Objective, foundCommonWords: string[]): number =>
  objective.type === 'score' ? totalScore(foundCommonWords) : foundCommonWords.length
