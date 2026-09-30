import { describe, expect, it } from 'vitest'
import { deriveObjective, objectiveProgress, totalScore } from '~/utils/objectives'

const SOLUTION = new Set(['CAT', 'DOG', 'GOAT', 'TAG', 'COAT'])

describe('deriveObjective', () => {
  it('derives a word-count target as a fraction of available words', () => {
    expect(deriveObjective('words', SOLUTION)).toEqual({ kind: 'words', target: 2 })
  })

  it('derives a score target as a fraction of available score', () => {
    const objective = deriveObjective('score', SOLUTION)
    expect(objective.kind).toBe('score')
    expect(objective.target).toBeGreaterThan(0)
    expect(objective.target).toBeLessThanOrEqual(totalScore(SOLUTION))
  })

  it('never sets an impossible or zero target', () => {
    expect(deriveObjective('words', new Set(['CAT'])).target).toBe(1)
    expect(deriveObjective('score', new Set()).target).toBe(0)
  })
})

describe('objectiveProgress', () => {
  it('measures progress in the objective kind', () => {
    expect(objectiveProgress({ kind: 'words', target: 3 }, ['CAT', 'DOG'])).toBe(2)
    expect(objectiveProgress({ kind: 'score', target: 10 }, ['CAT'])).toBe(totalScore(['CAT']))
  })
})
