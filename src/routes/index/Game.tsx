import { FC, useState, useEffect, useMemo, useRef } from 'react'
import { Button } from '~/components/Button'
import { LetterTile } from '~/routes/index/LetterTile'
import { ScoredWord } from '~/routes/index/ScoredWord'
import { ScoredPoints } from '~/routes/index/ScoredPoints'
import { Score } from '~/routes/index/Score'
import { isAdjacent } from '~/utils/grid'
import { copyToClipboard } from '~/utils/clipboard'
import { GRID_SIZE } from '~/utils/config'
import { Puzzle } from '~/utils/daily'
import {
  deriveObjective,
  objectiveKindForDate,
  objectiveProgress,
  totalScore
} from '~/utils/objectives'
import { loadFoundWords, saveFoundWords } from '~/utils/storage'
import { twClassMerge } from '~/utils/tailwind'
import { calculateWordScore, checkWordValidity, isCommonWord } from '~/utils/word'

interface GameProps extends React.HTMLAttributes<HTMLDivElement> {
  puzzle: Puzzle
  /** The date the puzzle is for, used to store progress. */
  dateString: string
}

export const Game: FC<GameProps> = ({ puzzle, dateString, className, ...props }) => {
  const { seedString, letters, solution } = puzzle
  const objective = useMemo(
    () => deriveObjective(objectiveKindForDate(dateString), solution),
    [dateString, solution]
  )
  const [seedCopied, setSeedCopied] = useState<boolean>(false)
  const seedCopiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Variables used when selecting tiles
  const [tileCounts, setTileCounts] = useState<number[]>(Array(letters.length).fill(0))
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])
  const lastSelected = selectedIndices[selectedIndices.length - 1]

  // Variables used when submitting words
  // vMsg = validity message
  const [showVMsg, setShowVMsg] = useState<boolean>(false)
  const [vMsg, setVMsg] = useState<string>('')
  const vMsgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Variables used to display score UI. Every accepted word is stored (so progress can be
  // restored), but only common words are counted towards the score and objective.
  const [foundWords, setFoundWords] = useState<string[]>(() => loadFoundWords(dateString))
  const countedWords = useMemo(() => foundWords.filter(isCommonWord), [foundWords])
  const score = totalScore(countedWords)
  const progress = objectiveProgress(objective, countedWords)
  const objectiveComplete = progress >= objective.target
  const [showScoredPoints, setShowScoredPoints] = useState<boolean>(false)
  const [lastScoredPoints, setLastScoredPoints] = useState<number>(0)

  // Animation toggle
  // TODO: load from settings, userprefs, cookie, something like that
  const [animate] = useState<boolean>(true)

  // Persist progress
  useEffect(() => saveFoundWords(dateString, foundWords), [dateString, foundWords])

  const handleCopySeed = async () => {
    if (!(await copyToClipboard(seedString))) return
    setSeedCopied(true)
    if (seedCopiedTimerRef.current) clearTimeout(seedCopiedTimerRef.current)
    seedCopiedTimerRef.current = setTimeout(() => setSeedCopied(false), 1500)
  }

  const handleTileSelect = (selectedTileIndex: number) => {
    setShowVMsg(false) // hide validity message when selecting tiles

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

  const showMessage = (message: string) => {
    setVMsg(message)
    // Show message for 3 seconds
    setShowVMsg(true)
    if (vMsgTimerRef.current) clearTimeout(vMsgTimerRef.current)
    vMsgTimerRef.current = setTimeout(() => setShowVMsg(false), 3000)
  }

  const handleSubmit = () => {
    const word = selectedIndices.map((i) => letters[i]).join('')
    const wordValidity = checkWordValidity(word)
    if (!wordValidity.isValid) {
      showMessage(wordValidity.msg)
    } else if (foundWords.includes(word)) {
      showMessage(`${word} has already been scored`)
    } else {
      setFoundWords((prev) => [...prev, word])
      if (isCommonWord(word)) {
        // Update scored points UI
        setLastScoredPoints(calculateWordScore(word))
        setShowScoredPoints(true)
      } else {
        showMessage(`${word} is a valid word, but is too uncommon to count`)
      }
    }

    // Clear selection
    setSelectedIndices([])
    setTileCounts(Array(letters.length).fill(0))
  }

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (vMsgTimerRef.current) clearTimeout(vMsgTimerRef.current)
      if (seedCopiedTimerRef.current) clearTimeout(seedCopiedTimerRef.current)
    }
  }, [])

  return (
    <div
      className={twClassMerge('flex flex-col min-h-screen max-w-4xl mx-auto p-4', className)}
      {...props}
    >
      {/* Header with seed and (future) menu */}
      <header className="flex justify-between items-center mb-4">
        <span
          id="seed"
          className="text-sm text-body-700 cursor-pointer"
          title="Click to copy"
          onClick={handleCopySeed}
        >
          seed: {seedString}
          {seedCopied && ' (copied)'}
        </span>
        <span>{/* menu button or settings toggle here */}</span>
      </header>
      {/* Objective and progress */}
      <div id="objective" className="text-center mb-2" aria-live="polite">
        {objectiveComplete ? (
          <span className="text-primary-500 font-semibold">
            Objective complete! {countedWords.length} of {solution.size} words found.
          </span>
        ) : (
          <span>
            {objective.kind === 'score' ? 'Score' : 'Find'} {objective.target}{' '}
            {objective.kind === 'score' ? 'points' : 'words'} ({progress}/{objective.target})
          </span>
        )}
      </div>
      <main className="flex flex-col items-center flex-1 w-full">
        {/* Score and validity/selection message area */}
        <div id="upper" className="w-full flex flex-col items-center mb-4 h-32">
          <div className="relative flex items-center justify-center">
            <Score score={score} animated={animate} />
            <ScoredPoints
              points={lastScoredPoints}
              visible={showScoredPoints}
              animated={animate}
              onDone={() => setShowScoredPoints(false)}
            />
          </div>
          {showVMsg ? (
            <div
              id="validity-message"
              className="flex flex-col items-center text-center space-y-4 mt-2"
            >
              {vMsg}
            </div>
          ) : (
            <div id="selection" className="flex flex-col items-center space-y-2 mt-2">
              <span>{selectedIndices.length > 0 ? 'Selected letters' : '\u00A0'}</span>
              <span className="min-h-[2rem] flex items-center text-2xl font-semibold text-primary-500">
                {selectedIndices.length > 0
                  ? selectedIndices.map((i) => letters[i]).join('')
                  : '\u00A0'}
              </span>
            </div>
          )}
        </div>
        {/* Letter grid */}
        <div
          id="tiles"
          className={twClassMerge(
            'grid gap-1 w-fit mx-auto mb-4',
            {
              6: 'grid-cols-6 grid-rows-6',
              5: 'grid-cols-5 grid-rows-5',
              4: 'grid-cols-4 grid-rows-4'
            }[GRID_SIZE]
          )}
          style={{ aspectRatio: '1 / 1' }}
        >
          {letters.map((letter, i) => {
            // Only adjacent tiles can be selected, but the last selected tile stays enabled to allow deselecting
            const disabled =
              i !== lastSelected &&
              selectedIndices.length > 0 &&
              !isAdjacent(lastSelected, i, GRID_SIZE)
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
        {/* Lower section: submit button and scored words */}
        <div id="lower" className="flex flex-col items-center w-full space-y-4">
          <Button onClick={handleSubmit}>Submit word</Button>
          <div id="submitted-words" className="w-full flex flex-col items-center">
            <ul
              className="space-y-1 w-64 overflow-y-auto max-h-64 no-scrollbar"
              ref={(el) => {
                if (el) el.scrollTop = el.scrollHeight
              }}
            >
              {foundWords.length === 0 ? (
                <li className="text-center text-body-700">No words found</li>
              ) : (
                foundWords.map((word) => (
                  <ScoredWord
                    key={word}
                    word={word}
                    score={isCommonWord(word) ? calculateWordScore(word) : 0}
                    counted={isCommonWord(word)}
                    className="w-full"
                  />
                ))
              )}
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
