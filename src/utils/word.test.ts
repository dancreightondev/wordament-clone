import { beforeAll, describe, expect, it, vi } from 'vitest'
import { calculateWordScore, checkWordValidity, isCommonWord, loadDictionary } from '~/utils/word'

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

describe('checkWordValidity', () => {
  it('accepts dictionary and custom words, ignoring case', () => {
    expect(checkWordValidity('CAT')).toEqual({ isValid: true })
    expect(checkWordValidity('DOOT')).toEqual({ isValid: true })
  })

  it('rejects empty, short, unknown and rude words with a message', () => {
    expect(checkWordValidity('')).toMatchObject({ isValid: false })
    expect(checkWordValidity('CA')).toMatchObject({
      isValid: false,
      msg: expect.stringContaining('short')
    })
    expect(checkWordValidity('XYZ')).toMatchObject({
      isValid: false,
      msg: expect.stringContaining('not a valid')
    })
    expect(checkWordValidity('BADWORD')).toMatchObject({
      isValid: false,
      msg: expect.stringContaining('profane')
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
