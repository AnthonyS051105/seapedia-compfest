'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface FoldPanelItem {
  id: string
  title: string
  description: string
  accent: string
}

export function FoldPanels({ items }: { items: FoldPanelItem[] }) {
  const [activeId, setActiveId] = useState(items[0]?.id)

  return (
    <div className="flex flex-col gap-3 md:h-100 md:flex-row">
      {items.map((item) => {
        const isActive = item.id === activeId

        return (
          <motion.button
            key={item.id}
            type="button"
            onClick={() => setActiveId(item.id)}
            animate={{ flexGrow: isActive ? 6 : 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'relative flex min-h-24 flex-1 basis-0 overflow-hidden rounded-2xl text-left transition-colors duration-300 md:min-h-0',
              isActive ? item.accent : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700'
            )}
          >
            <div
              className={cn(
                'flex h-full w-full flex-col justify-end p-5 md:p-6',
                !isActive && 'md:[writing-mode:vertical-rl] md:justify-between'
              )}
            >
              <h3
                className={cn(
                  'font-display text-lg font-semibold md:text-xl',
                  isActive ? 'text-white' : 'text-zinc-700 dark:text-zinc-300'
                )}
              >
                {item.title}
              </h3>

              {isActive && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.15 }}
                  className="mt-2 max-w-xs text-sm leading-relaxed text-white/85"
                >
                  {item.description}
                </motion.p>
              )}
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}
