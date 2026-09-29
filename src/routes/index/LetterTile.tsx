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
  extends
    Omit<React.HTMLAttributes<HTMLButtonElement>, 'onClick'>,
    Omit<VariantProps<typeof variants>, 'selectedCount'> {
  // Custom props go here
  letter: string
  /** How many times the tile is in the current word. Tiles may be re-used, so any count is allowed. */
  selectedCount: number
  onClick: () => void
  disabled?: boolean
}

const LetterTile: FC<LetterTileProps> = forwardRef<HTMLButtonElement, LetterTileProps>(
  ({ selectedCount, letter, onClick, className, ...props }, ref) => {
    // Counts above 5 share the final colour (casting necessary for CVA to work)
    const variantCount = Math.min(selectedCount, 5) as 0 | 1 | 2 | 3 | 4 | 5
    return (
      <button
        ref={ref}
        className={twClassMerge(variants({ selectedCount: variantCount, className }), 'flex')}
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
