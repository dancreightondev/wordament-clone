import { FC } from 'react'
import { twClassMerge } from '~/utils/tailwind'

interface LetterTileProps extends React.HTMLAttributes<HTMLDivElement> {
  // Custom props go here
  letter: string
  selectedCount: number
  onClick: () => void
  disabled?: boolean
}

export const LetterTile: FC<LetterTileProps> = ({
  letter,
  selectedCount,
  onClick,
  disabled,
  className,
  ...props
}) => {
  let bgClass = ''
  let textClass = ''
  switch (selectedCount) {
    case 1:
      bgClass = 'bg-tile-1'
      textClass = 'text-black/60'
      break
    case 2:
      bgClass = 'bg-tile-2'
      textClass = 'text-black/60'
      break
    case 3:
      bgClass = 'bg-tile-3'
      textClass = 'text-black/60'
      break
    case 4:
      bgClass = 'bg-tile-4'
      textClass = 'text-black/60'
      break
    case 5:
      bgClass = 'bg-tile-5'
      textClass = 'text-black/60'
      break
    default:
      break
  }
  return (
    <div
      className={twClassMerge(
        'rounded-lg border p-2 size-18 flex mx-auto',
        disabled ? `cursor-not-allowed ${!selectedCount ? 'opacity-25' : ''}` : '',
        bgClass,
        textClass,
        className
      )}
      {...props}
      onClick={onClick}
    >
      <span className="w-full flex justify-center items-center text-2xl">{letter}</span>
    </div>
  )
}
