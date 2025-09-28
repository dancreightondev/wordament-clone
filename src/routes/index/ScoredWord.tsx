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
        'flex justify-between items-center px-2 py-1 bg-black/40 rounded',
        className
      )}
      {...props}
    >
      <span className="font-mono">{word}</span>
      <span className="text-primary font-semibold">{score} pts</span>
    </li>
  )
}
