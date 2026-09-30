import { FC } from 'react'
import { twClassMerge } from '~/utils/tailwind'
import { motion, AnimatePresence } from 'motion/react'

interface ScoreProps extends React.HTMLAttributes<HTMLDivElement> {
  // Custom props go here
  score: number
  animated?: boolean
}

export const Score: FC<ScoreProps> = ({ score, animated = false, className, ...props }) => {
  return (
    <div
      className={twClassMerge(className, 'w-full mx-auto text-center justify-center')}
      {...props}
    >
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
    </div>
  )
}
