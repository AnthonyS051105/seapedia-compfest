'use client'

import { ReactNode, useRef } from 'react'
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface TiltCardProps {
  children: ReactNode
  className?: string
  /** Max tilt rotation in degrees. */
  maxTilt?: number
  /** Enables the cursor-following spotlight glow. */
  spotlight?: boolean
  /** Border radius applied to the spotlight overlay so it matches the card. */
  radiusClassName?: string
}

export function TiltCard({
  children,
  className,
  maxTilt = 8,
  spotlight = true,
  radiusClassName = 'rounded-xl',
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null)

  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const springRotateX = useSpring(rotateX, { stiffness: 300, damping: 25 })
  const springRotateY = useSpring(rotateY, { stiffness: 300, damping: 25 })

  const spotX = useMotionValue(50)
  const spotY = useMotionValue(50)
  const spotlightBackground = useMotionTemplate`radial-gradient(220px circle at ${spotX}% ${spotY}%, rgb(0 191 168 / 0.12), transparent 75%)`

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width
    const py = (event.clientY - rect.top) / rect.height

    rotateY.set((px - 0.5) * maxTilt * 2)
    rotateX.set((0.5 - py) * maxTilt * 2)
    spotX.set(px * 100)
    spotY.set(py * 100)
  }

  const handlePointerLeave = () => {
    rotateX.set(0)
    rotateY.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{ rotateX: springRotateX, rotateY: springRotateY, transformPerspective: 800 }}
      className={cn('relative', className)}
    >
      {children}
      {spotlight && (
        <motion.div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100',
            radiusClassName
          )}
          style={{ background: spotlightBackground }}
        />
      )}
    </motion.div>
  )
}
