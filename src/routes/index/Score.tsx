import { FC } from 'react'
import { twClassMerge } from '~/utils/tailwind'
import { motion, AnimatePresence } from 'motion/react'

interface ScoreProps extends React.HTMLAttributes<HTMLDivElement> {
  // Custom props go here
  score: number
  /** A score to reach, shown small at the bottom right of the score without shifting it off-centre. */
  target?: number
  /** A small line of text under the score, such as what the number counts. */
  label?: string
  animated?: boolean
}

export const Score: FC<ScoreProps> = ({
  score,
  target,
  label,
  animated = false,
  className,
  ...props
}) => {
  return (
    <div
      className={twClassMerge(className, 'w-full mx-auto text-center justify-center')}
      {...props}
    >
      {/* The target is positioned off the number's corner, so the number itself stays centred */}
      <span className="relative inline-block">
        <AnimatePresence mode="wait">
          {animated ? (
            <motion.span
              key={score}
              className="text-5xl font-bold inline-block"
              initial={{ scale: 1.2, color: '#45b4b9' }}
              animate={{ scale: 1, color: '#fff' }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {score}
            </motion.span>
          ) : (
            <span className="text-5xl font-bold">{score}</span>
          )}
        </AnimatePresence>
        {target !== undefined && (
          <span className="absolute left-full bottom-1 ml-1 whitespace-nowrap text-base font-normal text-body-400">
            / {target}
          </span>
        )}
      </span>
      {label && <div className="text-sm text-body-400">{label}</div>}
    </div>
  )
}
