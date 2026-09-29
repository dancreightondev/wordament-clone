import { FC, forwardRef } from 'react'
import { twClassMerge } from '~/utils/tailwind'
import { VariantProps, cva } from 'class-variance-authority'

const variants = cva(
  // Styles shared between all variants. Tiles fill their grid cell and stay square.
  'rounded-lg aspect-square w-full flex items-center justify-center font-medium leading-none aria-disabled:opacity-25',
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
    Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>,
    Omit<VariantProps<typeof variants>, 'selectedCount'> {
  // Custom props go here
  letter: string
  /** How many times the tile is in the current word. Tiles may be re-used, so any count is allowed. */
  selectedCount: number
  onClick: React.MouseEventHandler<HTMLButtonElement>
  /**
   * Whether the tile cannot currently be selected. This is shown visually and to assistive
   * technology, but the tile is deliberately not `disabled`, so that drags across it still work.
   */
  unavailable?: boolean
}

const LetterTile: FC<LetterTileProps> = forwardRef<HTMLButtonElement, LetterTileProps>(
  ({ selectedCount, letter, onClick, unavailable = false, className, ...props }, ref) => {
    // Counts above 5 share the final colour (casting necessary for CVA to work)
    const variantCount = Math.min(selectedCount, 5) as 0 | 1 | 2 | 3 | 4 | 5
    return (
      <button
        ref={ref}
        type="button"
        className={twClassMerge(variants({ selectedCount: variantCount, className }))}
        aria-disabled={unavailable || undefined}
        aria-pressed={selectedCount > 0}
        {...props}
        onClick={onClick}
      >
        {/* Font size is inherited from the grid, which scales it with the tile size */}
        <span className="text-[1em]">{letter}</span>
      </button>
    )
  }
)

LetterTile.displayName = 'LetterTile'
// eslint-disable-next-line react-refresh/only-export-components
export { LetterTile, variants }
