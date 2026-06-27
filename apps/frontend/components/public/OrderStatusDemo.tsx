'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const STEPS = [
  { label: 'Pesanan dikemas', time: '09.12' },
  { label: 'Menunggu kurir', time: '09.40' },
  { label: 'Sedang diantar', time: '10.05' },
  { label: 'Pesanan tiba', time: '10.41' },
]

const CYCLE_MS = 1400
const RESET_PAUSE_MS = 1800

export function OrderStatusDemo() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const advance = window.setInterval(() => {
      setActiveIndex((current) => (current >= STEPS.length - 1 ? current : current + 1))
    }, CYCLE_MS)

    return () => window.clearInterval(advance)
  }, [])

  useEffect(() => {
    if (activeIndex !== STEPS.length - 1) return
    const reset = window.setTimeout(() => setActiveIndex(0), RESET_PAUSE_MS)
    return () => window.clearTimeout(reset)
  }, [activeIndex])

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {STEPS.map((step, i) => {
        const isDone = i <= activeIndex
        const isLast = i === STEPS.length - 1

        return (
          <div key={step.label} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <motion.span
                className={cn(
                  'h-3 w-3 shrink-0 rounded-full border-2 transition-colors duration-300',
                  isDone ? 'border-brand-500 bg-brand-500' : 'border-zinc-200 bg-transparent dark:border-zinc-700'
                )}
                animate={{ scale: i === activeIndex ? 1.15 : 1 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              />
              {!isLast && (
                <div
                  className={cn(
                    'min-h-4 w-0.5 flex-1 transition-colors duration-300',
                    i < activeIndex ? 'bg-brand-500' : 'bg-zinc-200 dark:bg-zinc-800'
                  )}
                />
              )}
            </div>

            <div className={isLast ? 'flex-1 pb-0' : 'flex-1 pb-4'}>
              <p
                className={cn(
                  'text-sm transition-colors duration-300',
                  isDone ? 'font-semibold text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-600'
                )}
              >
                {step.label}
              </p>
              {isDone && <p className="text-xs text-zinc-500 dark:text-zinc-500">{step.time}</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
