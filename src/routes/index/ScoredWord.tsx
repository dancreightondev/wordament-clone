import { FC } from 'react'
import { HTMLMotionProps, motion } from 'motion/react'
import { twClassMerge } from '~/utils/tailwind'

interface ScoredWordProps extends HTMLMotionProps<'li'> {
  // Custom props go here
  word: string
  score: number
  /** Whether the word counts towards the score. Valid but uncommon words do not. */
  counted?: boolean
  /** Whether to animate the row in, for a word that has just been added. */
  animated?: boolean
}

export const ScoredWord: FC<ScoredWordProps> = ({
  word,
  score,
  counted = true,
  animated = false,
  className,
  ...props
}) => {
  // Only words that count get the sweep. Uncounted ones just fade in, so they do not look like a score.
  const sweep = animated && counted
  return (
    <motion.li
      // Rows glide to their new place when a word is added above them
      layout="position"
      transition={{ duration: 0.25, ease: 'easeOut' }}
      id={`scored-word-${word}`}
      className={twClassMerge(
        'flex justify-between items-center px-3 py-2 bg-body-900 rounded-md',
        !counted && 'opacity-50',
        sweep && 'relative overflow-hidden',
        animated && !counted && 'animate-word-fade',
        className
      )}
      {...props}
    >
      {sweep && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-primary-500 animate-word-sweep"
        />
      )}
      <span className={twClassMerge('font-mono', sweep && 'animate-word-reveal')}>{word}</span>
      <span
        className={twClassMerge(
          counted ? 'text-primary-500 font-semibold' : 'text-body-400',
          sweep && 'animate-word-reveal'
        )}
      >
        {counted ? `${score} pts` : 'not counted'}
      </span>
      {/* TODO: Magnifying glass button to look up word */}
    </motion.li>
  )
}
