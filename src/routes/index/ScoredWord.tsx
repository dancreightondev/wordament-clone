import { FC } from 'react'
import { twClassMerge } from '~/utils/tailwind'

interface ScoredWordProps extends React.HTMLAttributes<HTMLLIElement> {
  // Custom props go here
  word: string
  score: number
}

export const ScoredWord: FC<ScoredWordProps> = ({ word, score, className, ...props }) => {
  return (
    <li
      id={`scored-word-${word}`}
      className={twClassMerge(
        'flex justify-between items-center px-3 py-2 bg-body-900 rounded-md',
        className
      )}
      {...props}
    >
      <span className="font-mono">{word}</span>
      <span className="text-primary-500 font-semibold">{score} pts</span>
      {/* TODO: Magnifying glass button to look up word */}
    </li>
  )
}
