/* eslint-disable @typescript-eslint/no-empty-object-type */
import { FC, useState, useEffect, useMemo, useRef } from 'react'
import { Button } from '~/components/Button'
import { LetterTile } from '~/routes/index/LetterTile'
import { ScoredWord } from '~/routes/index/ScoredWord'
import { ScoredPoints } from '~/routes/index/ScoredPoints'
import { Score } from '~/routes/index/Score'
import { generateGridLetters } from '~/utils/grid'
import { copyToClipboard } from '~/utils/clipboard'
import { generateSeedString, stringToSeed } from '~/utils/seed'
import { twClassMerge } from '~/utils/tailwind'
import { calculateWordScore, checkWordValidity, loadDictionary } from '~/utils/word'

interface IndexProps extends React.HTMLAttributes<HTMLDivElement> {
  // Custom props go here
}

const GRID_SIZE: number = 4 // should be restricted to 4, 5 or 6
const VOWEL_COUNT: number = GRID_SIZE * 2 - 3 // 2x-3 is a heuristic formula for reasonable vowel count

export const Index: FC<IndexProps> = ({ className, ...props }) => {
  // Variables used to generate letter grid
  const [seedString] = useState<string>(generateSeedString)
  const letters = useMemo(
    () => generateGridLetters(GRID_SIZE, stringToSeed(seedString), VOWEL_COUNT),
    [seedString]
  )
  const [seedCopied, setSeedCopied] = useState<boolean>(false)
  const seedCopiedTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Variables used to track loading of the dictionary
  const [dictionaryStatus, setDictionaryStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  // Variables used when selecting tiles
  const [tileCounts, setTileCounts] = useState<number[]>(Array(letters.length).fill(0))
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])
  const lastSelected = selectedIndices[selectedIndices.length - 1]

  // Variables used when submitting words
  // vMsg = validity message
  const [showVMsg, setShowVMsg] = useState<boolean>(false)
  const [vMsg, setVMsg] = useState<string>('')
  const vMsgTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Variables used to display score UI
  const [score, setScore] = useState<number>(0)
  const [scoredWords, setScoredWords] = useState<{ word: string; score: number }[]>([])
  const [showScoredPoints, setShowScoredPoints] = useState<boolean>(false)
  const [lastScoredPoints, setLastScoredPoints] = useState<number>(0)

  // Animation toggle
  // TODO: load from settings, userprefs, cookie, something like that
  const [animate] = useState<boolean>(true)

  // Load dictionary on mount, and again whenever a retry is requested
  const [dictionaryAttempt, setDictionaryAttempt] = useState<number>(0)
  useEffect(() => {
    let cancelled = false
    loadDictionary()
      .then(() => !cancelled && setDictionaryStatus('ready'))
      .catch((error) => {
        console.error('Failed to load dictionary', error)
        if (!cancelled) setDictionaryStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [dictionaryAttempt])

  const handleCopySeed = async () => {
    if (!(await copyToClipboard(seedString))) return
    setSeedCopied(true)
    if (seedCopiedTimerRef.current) clearTimeout(seedCopiedTimerRef.current)
    seedCopiedTimerRef.current = setTimeout(() => setSeedCopied(false), 1500)
  }

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

  const handleSubmit = () => {
    if (dictionaryStatus !== 'ready') return
    const word = selectedIndices.map((i) => letters[i]).join('')
    const wordValidity = checkWordValidity(word)
    const alreadyScored = scoredWords.some(({ word: w }) => w === word)
    if (wordValidity.isValid && !alreadyScored) {
      // Calculate score
      const wordScore = calculateWordScore(word)
      // Add word to scored words list
      setScoredWords((prev) => [...prev, { word, score: wordScore }])

      // Update overall score
      const updatedScore = score + wordScore
      setScore(updatedScore)

      // Update scored points UI
      setLastScoredPoints(wordScore)
      setShowScoredPoints(true)

      // If not valid and unique
    } else {
      // Show a validity message
      setVMsg(wordValidity.isValid ? `${word} has already been scored` : wordValidity.msg)

      // Show message for 3 seconds
      setShowVMsg(true)
      if (vMsgTimerRef.current) clearTimeout(vMsgTimerRef.current)
      vMsgTimerRef.current = setTimeout(() => {
        setShowVMsg(false)
      }, 3000)
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
          <Button onClick={handleSubmit} disabled={dictionaryStatus !== 'ready'}>
            Submit word
          </Button>
          {dictionaryStatus === 'loading' && (
            <span className="text-body-400">Loading dictionary...</span>
          )}
          {dictionaryStatus === 'error' && (
            <div role="alert" className="flex flex-col items-center space-y-2">
              <span>Could not load the dictionary.</span>
              <Button
                size="sm"
                onClick={() => {
                  setDictionaryStatus('loading')
                  setDictionaryAttempt((n) => n + 1)
                }}
              >
                Try again
              </Button>
            </div>
          )}
          <div id="submitted-words" className="w-full flex flex-col items-center">
            <ul
              className="space-y-1 w-64 overflow-y-auto max-h-64 no-scrollbar"
              ref={(el) => {
                if (el) el.scrollTop = el.scrollHeight
              }}
            >
              {scoredWords.length === 0 ? (
                <li className="text-center text-body-700">No words found</li>
              ) : (
                scoredWords.map(({ word, score }, idx) => (
                  <ScoredWord key={idx} word={word} score={score} className="w-full" />
                ))
              )}
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
