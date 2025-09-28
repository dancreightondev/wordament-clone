import { FC, forwardRef } from 'react'
import { twClassMerge } from '~/utils/tailwind'
import { VariantProps, cva } from 'class-variance-authority'

const variants = cva(
  // Styles shared between all variants
  'rounded-lg size-18 flex mx-auto disabled:cursor-not-allowed disabled:opacity-25',
  {
    variants: {
      selectedCount: {
        0: 'bg-body-900',
        1: 'bg-tile-1 text-body-950',
        2: 'bg-tile-2 text-body-950',
        3: 'bg-tile-3 text-body-950',
        4: 'bg-tile-4 text-body-950',
        5: 'bg-tile-5 text-body-950'
      }
    },
    defaultVariants: {
      selectedCount: 0
    }
  }
)

interface LetterTileProps
  extends React.HTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof variants> {
  // Custom props go here
  letter: string
  selectedCount: 0 | 1 | 2 | 3 | 4 | 5
  onClick: () => void
  disabled?: boolean
}

const LetterTile: FC<LetterTileProps> = forwardRef<HTMLButtonElement, LetterTileProps>(
  ({ selectedCount, letter, onClick, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={twClassMerge(variants({ selectedCount, className }), 'flex')}
        {...props}
        onClick={onClick}
      >
        <span className="w-full flex justify-center items-center text-3xl">{letter}</span>
      </button>
    )
  }
)

LetterTile.displayName = 'LetterTile'
// eslint-disable-next-line react-refresh/only-export-components
export { LetterTile, variants }
