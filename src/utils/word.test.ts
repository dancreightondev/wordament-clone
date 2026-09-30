import { beforeAll, describe, expect, it, vi } from 'vitest'
import { calculateWordScore, checkSubmission, isCommonWord, loadDictionary } from '~/utils/word'

const files: Record<string, string> = {
  '/dictionary.txt': 'cat\ndog\nbadword\n',
  '/custom_words.txt': 'doot\n',
  '/rude_words.txt': 'badword\n',
  '/common_words.txt': 'cat\n'
}

beforeAll(async () => {
  vi.stubGlobal('fetch', async (path: string) => ({
    ok: path in files,
    status: path in files ? 200 : 404,
    text: async () => files[path]
  }))
  await loadDictionary()
})

describe('checkSubmission', () => {
  it('accepts and counts new common words, ignoring case', () => {
    expect(checkSubmission('CAT', [])).toEqual({ accepted: true, counted: true })
  })

  it('accepts uncommon dictionary and custom words without counting them, with a warning', () => {
    const uncommon = { accepted: true, counted: false, msg: 'Uncommon word', tone: 'warning' }
    expect(checkSubmission('DOG', [])).toEqual(uncommon)
    expect(checkSubmission('DOOT', [])).toEqual(uncommon)
  })

  it('rejects words that have already been found', () => {
    const rejected = { accepted: false, msg: 'Already scored', tone: 'error' }
    expect(checkSubmission('CAT', ['CAT'])).toEqual(rejected)
    expect(checkSubmission('DOG', ['DOG'])).toEqual(rejected)
  })

  it('rejects empty, short, unknown and rude words with an error message', () => {
    expect(checkSubmission('', [])).toMatchObject({ accepted: false, tone: 'error' })
    expect(checkSubmission('CA', [])).toEqual({ accepted: false, msg: 'Too short', tone: 'error' })
    expect(checkSubmission('XYZ', [])).toEqual({
      accepted: false,
      msg: 'Not a word',
      tone: 'error'
    })
    expect(checkSubmission('BADWORD', [])).toEqual({
      accepted: false,
      msg: 'Profane or inappropriate',
      tone: 'error'
    })
  })
})

describe('isCommonWord', () => {
  it('only counts words in the common list, ignoring case', () => {
    expect(isCommonWord('CAT')).toBe(true)
    expect(isCommonWord('dog')).toBe(false)
  })
})

describe('calculateWordScore', () => {
  it('sums letter values', () => {
    expect(calculateWordScore('CAT')).toBe(3 + 1 + 1)
    expect(calculateWordScore('')).toBe(0)
  })
})
