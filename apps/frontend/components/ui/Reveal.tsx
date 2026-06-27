'use client'

import { ReactNode } from 'react'
import { motion, useReducedMotion, Variants } from 'framer-motion'
import { cn } from '@/lib/utils'

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const

export interface RevealProps {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
  /** Stagger direct motion children instead of animating this element directly. */
  stagger?: boolean
  staggerGap?: number
}

const itemVariants = (y: number): Variants => ({
  hidden: { opacity: 0, y },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT_EXPO } },
})

export function Reveal({ children, className, delay = 0, y = 20, stagger = false, staggerGap = 0.08 }: RevealProps) {
  const reduce = useReducedMotion()

  if (stagger) {
    return (
      <motion.div
        className={className}
        initial={reduce ? undefined : 'hidden'}
        whileInView={reduce ? undefined : 'visible'}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ staggerChildren: staggerGap, delayChildren: delay }}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <motion.div
      className={className}
      initial={reduce ? undefined : { opacity: 0, y }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay, ease: EASE_OUT_EXPO }}
    >
      {children}
    </motion.div>
  )
}

export function RevealItem({ children, className, y = 16 }: { children: ReactNode; className?: string; y?: number }) {
  return (
    <motion.div className={cn(className)} variants={itemVariants(y)}>
      {children}
    </motion.div>
  )
}
