import { FC } from 'react'
import { twClassMerge } from '~/utils/tailwind'
import { motion, AnimatePresence } from 'motion/react'

interface ScoredPointsProps extends React.HTMLAttributes<HTMLDivElement> {
  // Custom props go here
  points: number
  visible?: boolean
  animated?: boolean
  onDone?: () => void
}

export const ScoredPoints: FC<ScoredPointsProps> = ({
  points,
  visible = true,
  animated = true,
  onDone,
  className,
  ...props
}) => {
  return (
    <div className={twClassMerge(className)} {...props}>
      <AnimatePresence>
        {visible && (
          <motion.div
            key={points}
            initial={animated ? { opacity: 0, y: 0, scale: 0.8 } : undefined}
            animate={animated ? { opacity: 1, y: 0, scale: 1.1 } : undefined}
            exit={animated ? { opacity: 0, y: -30, scale: 0.7 } : undefined}
            transition={{ type: 'spring', stiffness: 300, damping: 20, duration: 0.7 }}
            className="absolute z-20 text-3xl font-bold text-primary-500 pointer-events-none select-none"
            style={{ left: '25%', top: '0%', transform: 'translate(-50%, -100%)' }}
            onAnimationComplete={onDone}
          >
            +{points}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
