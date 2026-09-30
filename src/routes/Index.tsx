import { FC, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '~/components/Button'
import { Game } from '~/routes/index/Game'
import { GRID_SIZE, VOWEL_COUNT } from '~/utils/config'
import { usePrefersReducedMotion } from '~/utils/motion'
import { SEED_PARAM, generateSeedString, getSeedFromSearch } from '~/utils/seed'
import { generateDailyPuzzle, getDailyDateString } from '~/utils/daily'
import { twClassMerge } from '~/utils/tailwind'
import { getCommonTrie, loadDictionary } from '~/utils/word'

const FADE_MS = 200

/** Keeps the address bar as a shareable link to a zen game, and clears it for anything else. */
const setSeedInUrl = (seed: string | null) => {
  const url = new URL(window.location.href)
  if (seed) url.searchParams.set(SEED_PARAM, seed)
  else url.searchParams.delete(SEED_PARAM)
  window.history.replaceState(null, '', url)
}

export const Index: FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => {
  const [dateString] = useState<string>(getDailyDateString)
  // A link with a seed (`?seed=...`) opens that zen game directly
  const [linkedSeed] = useState<string | null>(() => getSeedFromSearch(window.location.search))
  // The game in progress, if any. Zen games use a random seed unless one was linked to.
  const [mode, setMode] = useState<'daily' | 'zen' | null>(linkedSeed ? 'zen' : null)
  // The landing page doubles as the menu: opening it keeps the game mounted, so it can be resumed
  const [menuOpen, setMenuOpen] = useState<boolean>(false)
  const [zenSeed, setZenSeed] = useState<string>(linkedSeed ?? '')

  // Changing screens fades the current one out, switches, then fades the new one in
  const animate = !usePrefersReducedMotion()
  const [visible, setVisible] = useState<boolean>(true)
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
    },
    []
  )
  const changeScreen = (change: () => void) => {
    if (!animate) return change()
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
    setVisible(false)
    fadeTimerRef.current = setTimeout(() => {
      change()
      setVisible(true)
    }, FADE_MS)
  }
  const [dictionaryStatus, setDictionaryStatus] = useState<'loading' | 'ready' | 'error'>('loading')

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

  // The puzzle depends on the common words, so it can only be generated once they have loaded
  const seedString = mode === 'zen' ? zenSeed : dateString
  const puzzle = useMemo(
    () =>
      dictionaryStatus === 'ready' && mode
        ? generateDailyPuzzle(seedString, getCommonTrie(), GRID_SIZE, VOWEL_COUNT)
        : null,
    [dictionaryStatus, mode, seedString]
  )

  const fade = (content: React.ReactNode) => (
    <div
      className={twClassMerge(
        animate && 'transition-opacity ease-in-out',
        visible ? 'opacity-100' : 'opacity-0'
      )}
      style={animate ? { transitionDuration: `${FADE_MS}ms` } : undefined}
    >
      {content}
    </div>
  )

  const startDaily = () =>
    changeScreen(() => {
      setMode('daily')
      setSeedInUrl(null)
      setMenuOpen(false)
    })
  const startZen = () =>
    changeScreen(() => {
      const seed = generateSeedString()
      setZenSeed(seed)
      setSeedInUrl(seed)
      setMode('zen')
      setMenuOpen(false)
    })

  const inGame = !!(puzzle && mode)
  const showLanding = !inGame || menuOpen

  return fade(
    <>
      {puzzle && mode && (
        <Game
          // Remount for each new game so no state carries over
          key={`${mode}:${seedString}`}
          puzzle={puzzle}
          dateString={seedString}
          persist={mode === 'daily'}
          showSeed={mode === 'zen'}
          onExit={() => changeScreen(() => setMenuOpen(true))}
          // Kept mounted but hidden while the menu is open, so progress is not lost
          className={twClassMerge(className, showLanding && 'hidden')}
          {...props}
        />
      )}
      {showLanding && (
        <div
          className={twClassMerge(
            'relative flex flex-col items-center justify-center min-h-dvh p-4 space-y-4',
            className
          )}
          {...props}
        >
          {inGame && (
            // Positioned to match the menu button in the game header
            <div className="absolute inset-x-0 top-0 max-w-md mx-auto px-4 pt-3 flex justify-end">
              <button
                type="button"
                aria-label="Close menu and resume game"
                title="Resume"
                onClick={() => changeScreen(() => setMenuOpen(false))}
                className="size-10 -mr-2 flex items-center justify-center rounded-lg text-body-700 hover:text-primary-500 transition-colors duration-75 hover:cursor-pointer outline-offset-2 outline-body-700 focus:outline-2"
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
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          )}
          {dictionaryStatus === 'error' ? (
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
          ) : (
            <>
              <h1 className="text-3xl font-bold">Wordiac</h1>
              <span className="text-body-400 h-6">
                {dictionaryStatus === 'loading' ? 'Loading...' : ' '}
              </span>
              <div className="flex flex-col w-full max-w-xs gap-4">
                <Button
                  className="h-20 justify-center text-xl"
                  disabled={dictionaryStatus !== 'ready'}
                  // Choosing the daily puzzle while playing it just resumes it
                  onClick={
                    mode === 'daily' ? () => changeScreen(() => setMenuOpen(false)) : startDaily
                  }
                >
                  {mode === 'daily' ? 'Resume daily puzzle' : 'Daily puzzle'}
                </Button>
                <Button
                  variant="primary-outlined"
                  className="h-20 justify-center text-xl"
                  disabled={dictionaryStatus !== 'ready'}
                  onClick={startZen}
                >
                  {mode === 'zen' ? 'New zen game' : 'Zen mode'}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
