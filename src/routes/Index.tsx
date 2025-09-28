/* eslint-disable @typescript-eslint/no-empty-object-type */
import { FC, useState, useEffect } from 'react'
import { LetterTile } from '~/routes/index/LetterTile'
import { ScoredWord } from '~/routes/index/ScoredWord'
import { generateGridLetters, stringToSeed } from '~/utils/grid'
import { twClassMerge } from '~/utils/tailwind'
import { calculateWordScore, checkWordValidity, loadDictionary } from '~/utils/word'

interface IndexProps extends React.HTMLAttributes<HTMLDivElement> {
  // Custom props go here
}

const GRID_SIZE: number = 4 // should be restricted to 4, 5 or 6
const VOWEL_COUNT: number = GRID_SIZE * 2 - 3 // 2x-3 is a heuristic formula for reasonable vowel count

export const Index: FC<IndexProps> = ({ className, ...props }) => {
  const [seedString, setSeedString] = useState<string>('default')
  const seed = stringToSeed(seedString)
  const letters = generateGridLetters(GRID_SIZE, seed, VOWEL_COUNT)

  const [tileCounts, setTileCounts] = useState<number[]>(Array(letters.length).fill(0))
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])
  const lastSelected = selectedIndices[selectedIndices.length - 1]

  const [scoredWords, setScoredWords] = useState<{ word: string; score: number }[]>([])

  // Load dictionary on mount
  useEffect(() => {
    loadDictionary()
    const newSeed = new Date().getTime().toString()
    setSeedString(newSeed)
    console.log(`Using seed string: ${newSeed}`)
  }, [])

  const isAdjacent = (iLast: number, iNew: number, gridSize: number) => {
    if (iLast === undefined) return true // First selection allowed anywhere
    const lastRow = Math.floor(iLast / gridSize)
    const lastCol = iLast % gridSize
    const newRow = Math.floor(iNew / gridSize)
    const newCol = iNew % gridSize
    return (
      Math.abs(lastRow - newRow) <= 1 &&
      Math.abs(lastCol - newCol) <= 1 &&
      !(lastRow === newRow && lastCol === newCol)
    )
  }

  const handleTileSelect = (selectedTileIndex: number) => {
    // Deselect if clicking the last selected tile
    if (selectedIndices.length > 0 && selectedTileIndex === lastSelected) {
      setTileCounts((prev) =>
        prev.map((count, i) => (i === selectedTileIndex ? Math.max(0, count - 1) : count))
      )
      setSelectedIndices((prev) => prev.slice(0, -1))
      return
    }

    // Only allow selection if adjacent or first selection
    if (selectedIndices.length === 0 || isAdjacent(lastSelected, selectedTileIndex, GRID_SIZE)) {
      setTileCounts((prev) => prev.map((count, i) => (i === selectedTileIndex ? count + 1 : count)))
      setSelectedIndices((prev) => [...prev, selectedTileIndex])
    }
  }

  const handleSubmit = () => {
    // Check if word is valid, and calculate its score if so
    const word = selectedIndices.map((i) => letters[i]).join('')
    if (checkWordValidity(word)) {
      const score = calculateWordScore(word)
      // Add word to scored words list
      setScoredWords((prev) => [...prev, { word, score }])
    }

    // Clear selection
    setSelectedIndices([])
    setTileCounts(Array(letters.length).fill(0))
  }
  return (
    <div className={twClassMerge('max-w-4xl p-4 mx-auto', className)} {...props}>
      <div id="upper" className="flex flex-col items-center m-4">
        <span>{selectedIndices.length > 0 ? 'Selected letters' : '\u00A0'}</span>
        <span className="min-h-[2rem] flex items-center">
          {selectedIndices.length > 0 ? selectedIndices.map((i) => letters[i]).join('') : '\u00A0'}
        </span>
      </div>
      <div
        id="tiles"
        className={twClassMerge(
          'grid gap-1 w-fit mx-auto',
          (() => {
            switch (GRID_SIZE) {
              case 6:
                return 'grid-cols-6 grid-rows-6'
              case 5:
                return 'grid-cols-5 grid-rows-5'
              default:
                return 'grid-cols-4 grid-rows-4'
            }
          })()
        )}
        style={{ aspectRatio: '1 / 1' }}
      >
        {letters.map((letter, i) => {
          let disabled = false
          // Prevent selecting the last selected tile again immediately (unless for deselect)
          if (i === lastSelected) {
            disabled = false // allow for deselect
          } else if (selectedIndices.length === 0) {
            disabled = false
          } else {
            disabled = !isAdjacent(lastSelected, i, GRID_SIZE)
          }

          return (
            <LetterTile
              key={i}
              letter={letter}
              selectedCount={tileCounts[i]}
              onClick={() => handleTileSelect(i)}
              disabled={disabled}
            />
          )
        })}
      </div>
      <div id="lower" className="flex flex-col items-center m-4">
        <button onClick={handleSubmit}>Submit</button>
        <div id="submitted-words" className="mt-6">
          <ul
            className="space-y-1 w-52 overflow-y-auto max-h-52 no-scrollbar"
            ref={(el) => {
              if (el) {
                el.scrollTop = el.scrollHeight
              }
            }}
          >
            {scoredWords.map(({ word, score }, idx) => (
              <ScoredWord key={idx} word={word} score={score} className="w-full" />
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
