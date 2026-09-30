import { describe, expect, it } from 'vitest'
import { countSelections, extendPath, isWithinTileCentre, toggleTile } from '~/utils/selection'

// 4x4 grid indices:
//  0  1  2  3
//  4  5  6  7
//  8  9 10 11
// 12 13 14 15

describe('toggleTile', () => {
  it('allows any first tile', () => {
    expect(toggleTile([], 9, 4)).toEqual([9])
  })

  it('adds adjacent tiles, including diagonals', () => {
    expect(toggleTile([0], 1, 4)).toEqual([0, 1])
    expect(toggleTile([0], 5, 4)).toEqual([0, 5])
  })

  it('ignores tiles that are not adjacent', () => {
    expect(toggleTile([0], 2, 4)).toEqual([0])
  })

  it('deselects the last tile when tapped again', () => {
    expect(toggleTile([0, 1], 1, 4)).toEqual([0])
  })

  it('allows tiles to be re-used', () => {
    expect(toggleTile([0, 1], 0, 4)).toEqual([0, 1, 0])
    expect(toggleTile([0, 1, 5, 4], 0, 4)).toEqual([0, 1, 5, 4, 0])
  })
})

describe('extendPath', () => {
  it('starts a path', () => {
    expect(extendPath([], 5, 4)).toEqual([5])
  })

  it('ignores staying on the same tile', () => {
    expect(extendPath([5], 5, 4)).toEqual([5])
  })

  it('extends onto adjacent tiles and ignores others', () => {
    expect(extendPath([5], 6, 4)).toEqual([5, 6])
    expect(extendPath([5], 7, 4)).toEqual([5])
  })

  it('backtracks when dragging onto the previous tile', () => {
    expect(extendPath([5, 6, 10], 6, 4)).toEqual([5, 6])
  })

  it('allows a tile already in the path to be added again when it is not the previous tile', () => {
    expect(extendPath([5, 6, 10, 9], 5, 4)).toEqual([5, 6, 10, 9, 5])
  })
})

describe('countSelections', () => {
  it('counts how often each tile is selected', () => {
    expect(countSelections([0, 1, 0], 4)).toEqual([2, 1, 0, 0])
  })
})

describe('isWithinTileCentre', () => {
  const rect = { left: 100, top: 100, width: 100, height: 100 }

  it('accepts the middle and rejects the edges and corners', () => {
    expect(isWithinTileCentre({ x: 150, y: 150 }, rect)).toBe(true)
    expect(isWithinTileCentre({ x: 105, y: 150 }, rect)).toBe(false)
    expect(isWithinTileCentre({ x: 102, y: 102 }, rect)).toBe(false)
    expect(isWithinTileCentre({ x: 250, y: 150 }, rect)).toBe(false)
  })
})
