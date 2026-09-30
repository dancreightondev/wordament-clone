import { FC, useState, useEffect, useMemo, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Button } from '~/components/Button'
import { LetterTile } from '~/routes/index/LetterTile'
import { ScoredWord } from '~/routes/index/ScoredWord'
import { ScoredPoints } from '~/routes/index/ScoredPoints'
import { Score } from '~/routes/index/Score'
import { isAdjacent } from '~/utils/grid'
import { usePrefersReducedMotion } from '~/utils/motion'
import { countSelections, extendPath, isWithinTileCentre, toggleTile } from '~/utils/selection'
import { copyToClipboard } from '~/utils/clipboard'
import { GRID_SIZE } from '~/utils/config'
import { Puzzle } from '~/utils/daily'
import { ObjectiveType, deriveObjective, objectiveProgress, totalScore } from '~/utils/objectives'
import { loadFoundWords, saveFoundWords } from '~/utils/storage'
import { twClassMerge } from '~/utils/tailwind'
import { MessageTone, calculateWordScore, checkSubmission, isCommonWord } from '~/utils/word'

/** The text colour for each message tone. */
const MESSAGE_TONE_CLASSES: Record<MessageTone, string> = {
  error: 'text-tile-5',
  warning: 'text-tile-4',
  info: 'text-primary-500',
  none: 'text-body-200' // make sure this matches index.css
}

interface GameProps extends React.HTMLAttributes<HTMLDivElement> {
  puzzle: Puzzle
  /** The date the puzzle is for, used to store progress. */
  dateString: string
  /** Whether to save and restore found words. Zen mode games are not persisted. */
  persist?: boolean
  /** Whether to show the seed, which the daily puzzle hides as it is just the date. */
  showSeed?: boolean
  /** Whether the objective is a score or a number of words. */
  objectiveType: ObjectiveType
  /** Called when the player asks to return to the landing page. */
  onExit?: () => void
}

export const Game: FC<GameProps> = ({
  puzzle,
  dateString,
  persist = true,
  showSeed = true,
  objectiveType,
  onExit,
  className,
  ...props
}) => {
  const { seedString, letters, solution } = puzzle
  const objective = useMemo(
    () => deriveObjective(objectiveType, solution),
    [objectiveType, solution]
  )
  const [seedCopied, setSeedCopied] = useState<boolean>(false)
  const seedCopiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Variables used when selecting tiles
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])
  const tileCounts = useMemo(
    () => countSelections(selectedIndices, letters.length),
    [selectedIndices, letters.length]
  )
  const lastSelected = selectedIndices[selectedIndices.length - 1]
  const gridRef = useRef<HTMLDivElement>(null)
  // Tracks a pointer (finger or mouse) that is pressed on the grid: the tile it started on, the
  // path selected before it started, and whether it has moved onto another tile (a drag)
  const dragRef = useRef<{
    pointerId: number
    startTile: number
    pathBefore: number[]
    path: number[]
    dragging: boolean
  } | null>(null)

  // Variables used when submitting words
  // vMsg = validity message
  const [showVMsg, setShowVMsg] = useState<boolean>(false)
  const [vMsg, setVMsg] = useState<string>('')
  const [vMsgTone, setVMsgTone] = useState<MessageTone>('error')
  const vMsgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Variables used to display score UI. Every accepted word is stored (so progress can be
  // restored), but only common words are counted towards the score and objective
  const [foundWords, setFoundWords] = useState<string[]>(() =>
    persist ? loadFoundWords(dateString) : []
  )
  const countedWords = useMemo(() => foundWords.filter(isCommonWord), [foundWords])
  const score = totalScore(countedWords)
  const progress = objectiveProgress(objective, countedWords)
  const objectiveComplete = progress >= objective.target
  const [showScoredPoints, setShowScoredPoints] = useState<boolean>(false)
  const [lastScoredPoints, setLastScoredPoints] = useState<number>(0)

  // Animations follow the device's reduced motion preference
  // TODO: also load from settings, userprefs, cookie, something like that
  const animate = !usePrefersReducedMotion()

  // Persist progress
  useEffect(() => {
    if (persist) saveFoundWords(dateString, foundWords)
  }, [persist, dateString, foundWords])

  const handleCopySeed = async () => {
    if (!(await copyToClipboard(seedString))) return
    setSeedCopied(true)
    if (seedCopiedTimerRef.current) clearTimeout(seedCopiedTimerRef.current)
    seedCopiedTimerRef.current = setTimeout(() => setSeedCopied(false), 1500)
  }

  /** Finds the tile under a point, if the point is near its centre. */
  const tileAtPoint = (x: number, y: number): number | null => {
    const element = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-tile]')
    if (!element || !gridRef.current?.contains(element)) return null
    return isWithinTileCentre({ x, y }, element.getBoundingClientRect())
      ? Number(element.dataset.tile)
      : null
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const element = (e.target as HTMLElement).closest<HTMLElement>('[data-tile]')
    if (!element) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setShowVMsg(false) // hide validity message when selecting tiles
    const startTile = Number(element.dataset.tile)
    dragRef.current = {
      pointerId: e.pointerId,
      startTile,
      pathBefore: selectedIndices,
      path: [],
      dragging: false
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    const tile = tileAtPoint(e.clientX, e.clientY)
    if (tile === null || (!drag.dragging && tile === drag.startTile)) return
    if (!drag.dragging) {
      // Moving onto another tile starts a new word from the tile the pointer went down on
      drag.dragging = true
      drag.path = [drag.startTile]
    }
    const path = extendPath(drag.path, tile, GRID_SIZE)
    if (path !== drag.path) {
      drag.path = path
      setSelectedIndices(path)
    }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    dragRef.current = null
    if (!drag.dragging) {
      // A tap: add or remove a single tile, and wait for the Submit button
      setSelectedIndices(toggleTile(drag.pathBefore, drag.startTile, GRID_SIZE))
    } else if (drag.path.length >= 2) {
      handleSubmit(drag.path)
    } else {
      setSelectedIndices([])
    }
  }

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    dragRef.current = null
    setSelectedIndices(drag.pathBefore)
  }

  /** Keyboard activation of a tile (pointer input is handled by the pointer events above). */
  const handleTileKeyboardClick = (tile: number, e: React.MouseEvent) => {
    if (e.detail !== 0) return // a real click, already handled as a tap by the pointer events
    setShowVMsg(false)
    setSelectedIndices((prev) => toggleTile(prev, tile, GRID_SIZE))
  }

  const showMessage = (message: string, tone: MessageTone) => {
    setVMsg(message)
    setVMsgTone(tone)
    // Show message for 3 seconds
    setShowVMsg(true)
    if (vMsgTimerRef.current) clearTimeout(vMsgTimerRef.current)
    vMsgTimerRef.current = setTimeout(() => setShowVMsg(false), 3000)
  }

  const handleSubmit = (path: number[] = selectedIndices) => {
    const word = path.map((i) => letters[i]).join('')
    const result = checkSubmission(word, foundWords)
    if (!result.accepted) {
      showMessage(result.msg, result.tone)
    } else {
      setFoundWords((prev) => [...prev, word])
      if (result.counted) {
        // Update scored points UI
        setLastScoredPoints(calculateWordScore(word))
        setShowScoredPoints(true)
      } else {
        showMessage(result.msg, result.tone)
      }
    }

    // Clear selection
    setSelectedIndices([])
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
      className={twClassMerge('flex flex-col min-h-dvh max-w-md mx-auto px-4 pt-3 pb-6', className)}
      {...props}
    >
      {/* Header with seed and (future) menu */}
      <header className="flex justify-between items-center mb-1">
        {showSeed && (
          <span
            id="seed"
            className="h-10 flex items-center text-sm text-body-700 hover:text-primary-500 transition-colors duration-75 cursor-pointer"
            title="Click to copy"
            onClick={handleCopySeed}
          >
            seed: {seedString}
            {seedCopied && ' (copied)'}
          </span>
        )}
        {onExit ? (
          <button
            type="button"
            aria-label="Menu"
            title="Menu"
            onClick={onExit}
            className="size-10 ml-auto -mr-2 flex items-center justify-center rounded-lg text-body-700 hover:text-primary-500 transition-colors duration-75 hover:cursor-pointer outline-offset-2 outline-body-700 focus:outline-2"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        ) : (
          <span />
        )}
      </header>
      {/* Objective and progress */}
      <div id="objective" className="text-center text-base mb-1 min-h-6" aria-live="polite">
        {/* Only shown once complete: while in progress, a score objective is shown beside the score
            and a word-count objective is shown as the counter above the list of words */}
        {objectiveComplete && (
          <span className="text-primary-500 font-semibold">
            Objective complete! {countedWords.length} of {solution.size} words found.
          </span>
        )}
      </div>
      <main className="flex flex-col items-center flex-1 w-full">
        {/* Score (score objectives only) and validity/selection message area */}
        <div
          id="upper"
          className={twClassMerge(
            'w-full flex flex-col items-center mb-3 shrink-0',
            objective.type === 'score' ? 'min-h-24' : 'min-h-8'
          )}
        >
          {objective.type === 'score' && (
            <div className="relative flex items-center justify-center">
              <Score score={score} target={objective.target} label="points" animated={animate} />
              <ScoredPoints
                points={lastScoredPoints}
                visible={showScoredPoints}
                animated={animate}
                onDone={() => setShowScoredPoints(false)}
              />
            </div>
          )}
          {/* The message and the selection fade between each other */}
          <AnimatePresence mode="wait" initial={false}>
            {showVMsg ? (
              <motion.div
                key="message"
                id="validity-message"
                role="status"
                // Same size as the selection, so the layout does not jump
                className={twClassMerge(
                  'min-h-8 mt-2 flex items-center text-center text-xl font-semibold',
                  MESSAGE_TONE_CLASSES[vMsgTone]
                )}
                initial={animate ? { opacity: 0, y: 6 } : undefined}
                animate={animate ? { opacity: 1, y: 0 } : undefined}
                exit={animate ? { opacity: 0, y: -6 } : undefined}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                {vMsg}
              </motion.div>
            ) : (
              <motion.div
                key="selection"
                id="selection"
                className="min-h-8 mt-2 flex items-center text-xl font-semibold text-primary-500"
                aria-label="Selected letters"
                initial={animate ? { opacity: 0 } : undefined}
                animate={animate ? { opacity: 1 } : undefined}
                exit={animate ? { opacity: 0 } : undefined}
                transition={{ duration: 0.15 }}
              >
                {selectedIndices.length > 0 ? selectedIndices.map((i) => letters[i]).join('') : ' '}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* Letter grid. The wrapper is a size container, so tile text scales with the grid width. */}
        <div className="@container w-full max-w-sm mx-auto mb-4 shrink-0">
          <div
            id="tiles"
            ref={gridRef}
            className={twClassMerge(
              'grid gap-[2.2cqw] w-full touch-none',
              {
                6: 'grid-cols-6',
                5: 'grid-cols-5',
                4: 'grid-cols-4'
              }[GRID_SIZE]
            )}
            // Tile text is around 45% of the tile width
            style={{ fontSize: `${45 / GRID_SIZE}cqw` }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
          >
            {letters.map((letter, i) => {
              // Only adjacent tiles can be selected, but the last selected tile stays available to allow deselecting
              const unavailable =
                i !== lastSelected &&
                selectedIndices.length > 0 &&
                !isAdjacent(lastSelected, i, GRID_SIZE)
              return (
                <LetterTile
                  key={i}
                  data-tile={i}
                  letter={letter}
                  selectedCount={tileCounts[i]}
                  aria-label={`${letter}, row ${Math.floor(i / GRID_SIZE) + 1}, column ${(i % GRID_SIZE) + 1}`}
                  onClick={(e) => handleTileKeyboardClick(i, e)}
                  unavailable={unavailable}
                />
              )
            })}
          </div>
        </div>
        {/* Lower section: submit button and scored words */}
        <div id="lower" className="flex flex-col items-center w-full space-y-3 shrink-0">
          <Button
            onClick={() => handleSubmit()}
            className="w-full max-w-sm min-h-11 justify-center"
          >
            Submit word
          </Button>
          <div id="submitted-words" className="w-full flex flex-col items-center">
            {/* Hidden until a word is found, as the list says so when it is empty */}
            {objective.type === 'words' && foundWords.length > 0 && (
              <div className="mb-1 flex w-full max-w-sm justify-between text-sm text-body-400">
                <span>
                  {progress} / {objective.target} words found
                </span>
                <span>{score} pts total</span>
              </div>
            )}
            <ul
              className="space-y-1 w-full max-w-sm overflow-y-auto max-h-48 no-scrollbar"
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
