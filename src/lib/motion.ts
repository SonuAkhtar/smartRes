/**
 * Shared animation constants.
 * Import these instead of repeating inline easing literals.
 *
 * Usage (framer-motion):
 *   transition={{ duration: DURATION.base, ease: EASE_SPRING }}
 *
 * Usage (CSS):
 *   transition: all 0.28s cubic-bezier(0.22, 1, 0.36, 1);
 */

export const EASE_SPRING:  [number, number, number, number] = [0.22, 1, 0.36, 1]
export const EASE_OUT:     [number, number, number, number] = [0, 0, 0.2, 1]
export const EASE_IN_OUT:  [number, number, number, number] = [0.4, 0, 0.2, 1]

export const DURATION = {
  fast:   0.18,
  base:   0.28,
  slow:   0.45,
  slower: 0.65,
} as const

/** Pre-built transition objects for common use cases */
export const TRANSITION = {
  fast:   { duration: DURATION.fast,  ease: EASE_OUT     },
  base:   { duration: DURATION.base,  ease: EASE_SPRING  },
  slow:   { duration: DURATION.slow,  ease: EASE_SPRING  },
  spring: { type: 'spring' as const,  stiffness: 300, damping: 24 },
} as const

/** Standard card/section enter animation */
export const fadeUpVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.slow, delay: i * 0.07, ease: EASE_SPRING },
  }),
} as const

/** Slide-in from the right (drawer/toast) */
export const slideInRight = {
  initial: { opacity: 0, x: 48, scale: 0.97 },
  animate: { opacity: 1, x: 0,  scale: 1    },
  exit:    { opacity: 0, x: 48, scale: 0.97, transition: { duration: DURATION.fast } },
} as const

/** Height collapse (accordion/expandable) */
export const heightCollapse = {
  hidden:  { opacity: 0, height: 0 },
  visible: { opacity: 1, height: 'auto', transition: { duration: DURATION.base, ease: EASE_SPRING } },
  exit:    { opacity: 0, height: 0,      transition: { duration: DURATION.fast  } },
} as const
