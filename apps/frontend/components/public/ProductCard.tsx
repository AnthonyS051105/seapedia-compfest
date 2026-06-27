'use client'

import Link from 'next/link'
import { ImageOff } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { TiltCard } from '@/components/ui/TiltCard'
import { Product } from '@/types'

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

export function ProductCard({ product }: { product: Product }) {
  const isOutOfStock = product.stock <= 0
  const isLowStock = !isOutOfStock && product.stock <= 5
  const image = product.images[0]

  return (
    <TiltCard maxTilt={6} className="group">
      <Link
        href={`/products/${product.id}`}
        className="block overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="relative aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageOff className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
            </div>
          )}

          {isOutOfStock ? (
            <Badge variant="red" className="absolute top-2 right-2">
              Habis
            </Badge>
          ) : isLowStock ? (
            <Badge variant="yellow" className="absolute top-2 right-2">
              Sisa {product.stock}
            </Badge>
          ) : null}
        </div>

        <div className="p-4">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
            {product.store.name}
          </p>
          <p className="mb-2 line-clamp-2 text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-100">
            {product.name}
          </p>
          <p className="font-display text-base font-bold text-zinc-950 dark:text-zinc-50">
            {formatRupiah(product.price)}
          </p>
        </div>
      </Link>
    </TiltCard>
  )
}
