import { FC, useEffect, useMemo, useState } from 'react'
import { Button } from '~/components/Button'
import { Game } from '~/routes/index/Game'
import { GRID_SIZE, VOWEL_COUNT } from '~/utils/config'
import { generateDailyPuzzle, getDailyDateString } from '~/utils/daily'
import { twClassMerge } from '~/utils/tailwind'
import { getCommonTrie, loadDictionary } from '~/utils/word'

export const Index: FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => {
  const [dateString] = useState<string>(getDailyDateString)
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
  const puzzle = useMemo(
    () =>
      dictionaryStatus === 'ready'
        ? generateDailyPuzzle(dateString, getCommonTrie(), GRID_SIZE, VOWEL_COUNT)
        : null,
    [dictionaryStatus, dateString]
  )

  if (puzzle) {
    return <Game puzzle={puzzle} dateString={dateString} className={className} {...props} />
  }

  return (
    <div
      className={twClassMerge(
        'flex flex-col items-center justify-center min-h-screen p-4 space-y-4',
        className
      )}
      {...props}
    >
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
        <span className="text-body-400">Loading today&apos;s puzzle...</span>
      )}
    </div>
  )
}
