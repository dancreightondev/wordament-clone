import { isAdjacent } from '~/utils/grid'

/**
 * Applies a tap on a tile to the current path of selected tiles (indices, in order).
 *
 * - Tapping the last selected tile deselects it.
 * - Tapping a tile adjacent to the last selected tile (or any tile, if nothing is selected) adds it.
 *   Tiles may be re-used, so a tile can appear in the path more than once.
 * - Any other tap leaves the path unchanged.
 */
export const toggleTile = (path: number[], tile: number, gridSize: number): number[] => {
  const last = path[path.length - 1]
  if (path.length > 0 && tile === last) return path.slice(0, -1)
  if (path.length === 0 || isAdjacent(last, tile, gridSize)) return [...path, tile]
  return path
}

/**
 * Applies a drag over a tile to the current path.
 *
 * - Staying on the last tile changes nothing.
 * - Dragging back onto the previous tile in the path removes the last tile (backtracking).
 * - Dragging onto a tile adjacent to the last tile adds it, including tiles already in the path.
 * - Dragging onto a tile that is not adjacent changes nothing.
 */
export const extendPath = (path: number[], tile: number, gridSize: number): number[] => {
  if (path.length === 0) return [tile]
  const last = path[path.length - 1]
  if (tile === last) return path
  if (path.length >= 2 && tile === path[path.length - 2]) return path.slice(0, -1)
  return isAdjacent(last, tile, gridSize) ? [...path, tile] : path
}

/** How many times each tile appears in the path, as an array indexed by tile. */
export const countSelections = (path: number[], tileCount: number): number[] => {
  const counts: number[] = Array(tileCount).fill(0)
  for (const tile of path) counts[tile]++
  return counts
}

/**
 * Whether a point is within the central part of a tile's bounding box. Drags only register on a
 * tile when the pointer is near its centre, so that diagonal swipes across corners do not select
 * a tile the player was not aiming for.
 *
 * @param inset - The fraction of the tile's width/height ignored at each edge (0 to 0.5).
 */
export const isWithinTileCentre = (
  point: { x: number; y: number },
  rect: { left: number; top: number; width: number; height: number },
  inset: number = 0.15
): boolean =>
  point.x >= rect.left + rect.width * inset &&
  point.x <= rect.left + rect.width * (1 - inset) &&
  point.y >= rect.top + rect.height * inset &&
  point.y <= rect.top + rect.height * (1 - inset)
