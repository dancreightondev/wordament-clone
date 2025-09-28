/* eslint-disable @typescript-eslint/no-empty-object-type */
import { FC, useState, useEffect, useRef } from 'react'
import { Button } from '~/components/Button'
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
  // Variables used to generate letter grid
  const [seedString, setSeedString] = useState<string>('default')
  const seed = stringToSeed(seedString)
  const letters = generateGridLetters(GRID_SIZE, seed, VOWEL_COUNT)

  // Variables used when selecting tiles
  const [tileCounts, setTileCounts] = useState<number[]>(Array(letters.length).fill(0))
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])
  const lastSelected = selectedIndices[selectedIndices.length - 1]

  // Variables used when submitting words
  // vMsg = validity message
  const [showVMsg, setShowVMsg] = useState<boolean>(false)
  const [vMsg, setVMsg] = useState<string>('')
  const vMsgTimerRef = useRef<NodeJS.Timeout | null>(null)
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
    const word = selectedIndices.map((i) => letters[i]).join('')
    const wordValidity = checkWordValidity(word)
    if (
      // Check if word is valid
      wordValidity.isValid &&
      // Check if word has not already been submitted
      !scoredWords.some(({ word: w }) => w === word)
    ) {
      // Calculate score
      const score = calculateWordScore(word)
      // Add word to scored words list
      setScoredWords((prev) => [...prev, { word, score }])

      // Send message to frontend depending on validity
      setVMsg(`+${score}`)
    } else {
      setVMsg(wordValidity.msg)
    }

    // Show message for 3 seconds
    setShowVMsg(true)
    if (vMsgTimerRef.current) clearTimeout(vMsgTimerRef.current)
    vMsgTimerRef.current = setTimeout(() => {
      setShowVMsg(false)
    }, 3000)

    // Clear selection
    setSelectedIndices([])
    setTileCounts(Array(letters.length).fill(0))
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (vMsgTimerRef.current) clearTimeout(vMsgTimerRef.current)
    }
  }, [])

  return (
    <div className={twClassMerge('max-w-4xl p-4 mx-auto', className)} {...props}>
      <div id="upper" className="h-24 m-4">
        {showVMsg ? (
          <div id="validity-message" className="flex flex-col items-center text-center space-y-4">
            {vMsg}
          </div>
        ) : (
          <div id="selection" className="flex flex-col items-center space-y-4">
            <span>{selectedIndices.length > 0 ? 'Selected letters' : '\u00A0'}</span>
            <span className="min-h-[2rem] flex items-center text-2xl font-semibold text-primary-500">
              {selectedIndices.length > 0
                ? selectedIndices.map((i) => letters[i]).join('')
                : '\u00A0'}
            </span>
          </div>
        )}
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
              selectedCount={tileCounts[i] as 0 | 1 | 2 | 3 | 4 | 5} // casting necessary for CVA to work
              onClick={() => handleTileSelect(i)}
              disabled={disabled}
            />
          )
        })}
      </div>
      <div id="lower" className="flex flex-col items-center m-4 space-y-4">
        <Button onClick={handleSubmit}>Submit word</Button>
        <div id="submitted-words">
          <ul
            className="space-y-1 w-64 overflow-y-auto max-h-64 no-scrollbar"
            ref={(el) => {
              if (el) {
                el.scrollTop = el.scrollHeight
              }
            }}
          >
            {scoredWords.length === 0 ? (
              <li className="text-center text-body-500">No words found</li>
            ) : (
              scoredWords.map(({ word, score }, idx) => (
                <ScoredWord key={idx} word={word} score={score} className="w-full" />
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
