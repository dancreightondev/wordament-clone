import { FC } from 'react'
import { twClassMerge } from '~/utils/tailwind'

interface ScoredWordProps extends React.HTMLAttributes<HTMLLIElement> {
  // Custom props go here
  word: string
  score: number
  /** Whether the word counts towards the score. Valid but uncommon words do not. */
  counted?: boolean
}

export const ScoredWord: FC<ScoredWordProps> = ({
  word,
  score,
  counted = true,
  className,
  ...props
}) => {
  return (
    <li
      id={`scored-word-${word}`}
      className={twClassMerge(
        'flex justify-between items-center px-3 py-2 bg-body-900 rounded-md',
        !counted && 'opacity-50',
        className
      )}
      {...props}
    >
      <span className="font-mono">{word}</span>
      <span className={counted ? 'text-primary-500 font-semibold' : 'text-body-400'}>
        {counted ? `${score} pts` : 'not counted'}
      </span>
      {/* TODO: Magnifying glass button to look up word */}
    </li>
  )
}
