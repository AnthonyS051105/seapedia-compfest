'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Package, Truck } from 'lucide-react'
import { WindowDots } from '@/components/ui/WindowDots'

type DemoStage = 'idle' | 'paying' | 'packed' | 'shipping' | 'done'

const STAGE_SEQUENCE: { stage: DemoStage; delay: number }[] = [
  { stage: 'paying', delay: 0 },
  { stage: 'packed', delay: 700 },
  { stage: 'shipping', delay: 1500 },
  { stage: 'done', delay: 2400 },
]

export function CheckoutMockup() {
  const [stage, setStage] = useState<DemoStage>('idle')

  const handlePay = () => {
    if (stage !== 'idle') return
    STAGE_SEQUENCE.forEach(({ stage: nextStage, delay }) => {
      window.setTimeout(() => setStage(nextStage), delay)
    })
    window.setTimeout(() => setStage('idle'), 4400)
  }

  const isAnimating = stage !== 'idle'

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white text-left shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center gap-1.5 border-b border-zinc-100 bg-zinc-50 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900">
        <WindowDots />
        <span className="ml-3 text-xs text-zinc-400 dark:text-zinc-500">Ringkasan belanja</span>
      </div>

      <div className="relative space-y-2 px-5 py-4">
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">Subtotal</span>
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Rp 450.000</span>
        </div>
        <div className="flex justify-between text-xs text-success-600 dark:text-success-500">
          <span>Diskon HEMAT10</span>
          <span>-Rp 45.000</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">Ongkos kirim</span>
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Rp 6.000</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">Pajak</span>
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Rp 49.320</span>
        </div>
        <div className="h-px bg-zinc-100 dark:bg-zinc-800" />
        <div className="flex justify-between text-sm font-bold">
          <span className="text-zinc-950 dark:text-zinc-50">Total</span>
          <span className="text-zinc-950 dark:text-zinc-50">Rp 460.320</span>
        </div>

        <motion.button
          type="button"
          onClick={handlePay}
          disabled={isAnimating}
          whileHover={isAnimating ? undefined : { y: -1 }}
          whileTap={isAnimating ? undefined : { scale: 0.97 }}
          animate={{ backgroundColor: stage === 'done' ? '#10B981' : '#00BFA8' }}
          className="relative mt-3 flex w-full items-center justify-center overflow-hidden rounded-lg py-2 text-center text-xs font-semibold text-white disabled:cursor-default"
        >
          <AnimatePresence mode="wait">
            {stage === 'idle' && (
              <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Bayar sekarang
              </motion.span>
            )}
            {stage === 'paying' && (
              <motion.span
                key="paying"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5"
              >
                <motion.span
                  className="h-3 w-3 rounded-full border-2 border-white/40 border-t-white"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
                />
                Memproses pembayaran
              </motion.span>
            )}
            {stage === 'packed' && (
              <motion.span
                key="packed"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex items-center gap-1.5"
              >
                <Package className="h-3.5 w-3.5" />
                Pesanan dikemas
              </motion.span>
            )}
            {stage === 'shipping' && (
              <motion.span
                key="shipping"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex items-center gap-1.5"
              >
                <Truck className="h-3.5 w-3.5" />
                Sedang diantar
              </motion.span>
            )}
            {stage === 'done' && (
              <motion.span
                key="done"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5"
              >
                <Check className="h-3.5 w-3.5" />
                Pesanan terkirim
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  )
}
