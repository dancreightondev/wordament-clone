import { FC, ReactNode, forwardRef } from 'react'
import { twClassMerge } from '~/utils/tailwind'
import { VariantProps, cva } from 'class-variance-authority'

const variants = cva(
  // Styles shared between all variants
  'rounded-lg text-center font-bold inline-flex items-center transition-colors duration-75 outline-offset-2 outline-body-700 focus:outline-2 hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        // Primary filled button styles
        'primary-filled': twClassMerge(
          'bg-primary-500 text-primary-900',
          // Styles separated for clarity - shared between filled and outlined
          'hover:bg-primary-400 active:bg-primary-600'
        ),
        // Primary outlined button styles
        'primary-outlined': twClassMerge(
          'border-2 border-primary-500 text-primary-500 hover:text-primary-900 hover:border-primary-400 active:border-primary-600 disabled:hover:bg-transparent',
          // Styles separated for clarity - shared between filled and outlined
          'hover:bg-primary-400 active:bg-primary-600'
        )
      },
      size: {
        md: 'text-md px-5 py-2.5',
        sm: 'text-sm px-3.5 py-2'
      }
    },
    defaultVariants: {
      variant: 'primary-filled',
      size: 'md'
    }
  }
)

interface ButtonProps
  extends React.HTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof variants> {
  // Custom props go here
  icon?: ReactNode
  disabled?: boolean
}

const Button: FC<ButtonProps> = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, icon, variant, size, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={twClassMerge(variants({ variant, size, className }), 'flex')}
        {...props}
      >
        {icon && <span className="size-5 mr-2.5">{icon}</span>}
        <span className="mx-auto flex-grow">{children}</span>
      </button>
    )
  }
)

Button.displayName = 'Button'
// eslint-disable-next-line react-refresh/only-export-components
export { Button, variants }
