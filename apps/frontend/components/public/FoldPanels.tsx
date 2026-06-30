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

function PanelContent({ item, isActive }: { item: FoldPanelItem; isActive: boolean }) {
  return (
    <div
      className={cn(
        'relative flex h-full w-full flex-col justify-end overflow-hidden p-6 md:p-7',
        !isActive && 'md:[writing-mode:vertical-rl] md:justify-between'
      )}
    >
      {isActive && <div aria-hidden="true" className="bg-grid-card pointer-events-none absolute inset-0" />}

      <h3
        className={cn(
          'relative font-display text-2xl font-bold md:text-2xl',
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
          className="relative mt-3 max-w-xs text-base leading-relaxed text-white/90"
        >
          {item.description}
        </motion.p>
      )}
    </div>
  )
}

export function FoldPanels({ items }: { items: FoldPanelItem[] }) {
  const [activeId, setActiveId] = useState(items[0]?.id)

  return (
    <>
      {/* Mobile: swipeable snap carousel, one card per view with a peek of the next */}
      <div className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 md:hidden scrollbar-none">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn('relative min-h-64 w-[85%] shrink-0 snap-center overflow-hidden rounded-2xl', item.accent)}
          >
            <PanelContent item={item} isActive />
          </div>
        ))}
      </div>

      {/* Desktop: fold/accordion panels */}
      <div className="hidden md:flex md:h-100 md:flex-row md:gap-3">
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
              <PanelContent item={item} isActive={isActive} />
            </motion.button>
          )
        })}
      </div>
    </>
  )
}
